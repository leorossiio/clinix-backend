/*
 * Pipeline de CI/CD da Clinix API (Declarative Pipeline).
 *
 * Plugins necessários: Pipeline, Docker Pipeline, JUnit, Coverage,
 * Workspace Cleanup e Timestamper. O agente precisa ter Docker.
 *
 * Credenciais usadas apenas no deploy (cadastre em Manage Jenkins › Credentials):
 *   - clinix-registry   (usuário/senha)  registro de imagens Docker
 *   - clinix-azure-sp   (usuário/senha)  service principal do Azure: appId / senha
 *
 * Fluxo: todo push roda qualidade + testes; a main também gera, testa e
 * publica a imagem; o deploy só acontece com o parâmetro DEPLOY marcado.
 */
pipeline {
  agent any

  parameters {
    booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Publicar a imagem e fazer deploy no Azure (somente main)')
    string(name: 'REGISTRY', defaultValue: 'clinix.azurecr.io', description: 'Registro de imagens Docker')
    string(name: 'AZURE_WEBAPP', defaultValue: 'clinix-backend-api', description: 'Nome do App Service no Azure')
    string(name: 'AZURE_RESOURCE_GROUP', defaultValue: 'clinix', description: 'Resource group do App Service')
    string(name: 'AZURE_TENANT', defaultValue: '', description: 'Tenant ID do Azure')
  }

  options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds(abortPrevious: true)
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    IMAGEM = 'clinix-backend'
    CI = 'true'
  }

  stages {
    stage('Build e testes') {
      agent {
        docker {
          image 'node:22-alpine'
          reuseNode true
        }
      }
      environment {
        // Cache do npm dentro do workspace: o usuário do container não tem HOME gravável.
        npm_config_cache = "${WORKSPACE}/.npm"
      }
      stages {
        stage('Instalar dependências') {
          steps {
            sh 'npm ci --no-audit --no-fund'
          }
        }
        stage('Qualidade') {
          parallel {
            stage('Lint') {
              steps { sh 'npm run lint' }
            }
            stage('Formatação') {
              steps { sh 'npm run format:check' }
            }
            stage('Vulnerabilidades') {
              steps { sh 'npm audit --omit=dev --audit-level=high' }
            }
          }
        }
        stage('Testes') {
          steps {
            // Inclui cobertura com limites mínimos definidos em vitest.config.js:
            // abaixo deles, o build falha.
            sh 'npm run test:ci'
          }
          post {
            always {
              junit testResults: 'reports/junit.xml', allowEmptyResults: false
              recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'reports/coverage/cobertura-coverage.xml']])
            }
          }
        }
      }
    }

    stage('Imagem Docker') {
      when { branch 'main' }
      steps {
        script {
          env.TAG = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        }
        sh 'docker build --pull -t "$IMAGEM:$TAG" .'
      }
    }

    stage('Smoke test da imagem') {
      when { branch 'main' }
      steps {
        // Sobe a imagem real em modo memória e confere o health check.
        sh '''
          set -e
          NOME="clinix-smoke-$BUILD_NUMBER"
          docker run -d --rm --name "$NOME" -e BANCO=memoria \
            -e JWT_SECRET="$(head -c 48 /dev/urandom | base64)" "$IMAGEM:$TAG"
          trap 'docker stop "$NOME" >/dev/null 2>&1 || true' EXIT
          for i in $(seq 1 20); do
            if docker exec "$NOME" wget -qO- http://127.0.0.1:3000/health; then exit 0; fi
            sleep 1
          done
          docker logs "$NOME"
          exit 1
        '''
      }
    }

    stage('Publicar imagem') {
      when {
        allOf { branch 'main'; expression { params.DEPLOY } }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'clinix-registry', usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh '''
            echo "$REG_PASS" | docker login "$REGISTRY" -u "$REG_USER" --password-stdin
            docker tag "$IMAGEM:$TAG" "$REGISTRY/$IMAGEM:$TAG"
            docker tag "$IMAGEM:$TAG" "$REGISTRY/$IMAGEM:latest"
            docker push "$REGISTRY/$IMAGEM:$TAG"
            docker push "$REGISTRY/$IMAGEM:latest"
          '''
        }
      }
    }

    stage('Deploy no Azure') {
      when {
        allOf { branch 'main'; expression { params.DEPLOY } }
      }
      steps {
        withCredentials([usernamePassword(credentialsId: 'clinix-azure-sp', usernameVariable: 'AZ_APP_ID', passwordVariable: 'AZ_SECRET')]) {
          sh '''
            docker run --rm -e AZ_APP_ID -e AZ_SECRET -e AZURE_TENANT -e AZURE_WEBAPP \
              -e AZURE_RESOURCE_GROUP -e REGISTRY -e IMAGEM -e TAG \
              mcr.microsoft.com/azure-cli sh -c '
                az login --service-principal -u "$AZ_APP_ID" -p "$AZ_SECRET" --tenant "$AZURE_TENANT" >/dev/null &&
                az webapp config container set --name "$AZURE_WEBAPP" --resource-group "$AZURE_RESOURCE_GROUP" \
                  --container-image-name "$REGISTRY/$IMAGEM:$TAG"
              '
          '''
        }
      }
    }
  }

  post {
    always {
      cleanWs(deleteDirs: true, notFailBuild: true)
    }
  }
}
