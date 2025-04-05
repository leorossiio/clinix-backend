-- Tabela Usuario
CREATE TABLE Usuario (
    ID_usuario SERIAL PRIMARY KEY,
    Status BOOLEAN NOT NULL,
    Nome VARCHAR(100) NOT NULL,
    Tipo_usuario VARCHAR(50) NOT NULL,
    Senha VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Especialidade VARCHAR(100),
    CRM VARCHAR(20) UNIQUE
);

-- Tabela Consulta
CREATE TABLE Consulta (
    ID_Consulta SERIAL PRIMARY KEY,
    ID_Medico INTEGER NOT NULL,         -- FK para Usuario (médico)
    ID_usuario INTEGER NOT NULL,        -- FK para Usuario (paciente)
    Data DATE NOT NULL,
    Horario TIME NOT NULL,
    Tipo_atendimento VARCHAR(100) NOT NULL,
    Status_consulta VARCHAR(50) NOT NULL,
    CRM VARCHAR(20),
    CONSTRAINT fk_medico FOREIGN KEY (ID_Medico) REFERENCES Usuario(ID_usuario),
    CONSTRAINT fk_usuario FOREIGN KEY (ID_usuario) REFERENCES Usuario(ID_usuario)
);

-- Tabela Notificacao
CREATE TABLE Notificacao (
    ID_notificacao SERIAL PRIMARY KEY,
    ID_User INTEGER NOT NULL,           -- FK para Usuario
    ID_Consulta INTEGER NOT NULL,       -- FK para Consulta
    Data TIMESTAMP NOT NULL,
    Lembrete TEXT,
    CONSTRAINT fk_notif_user FOREIGN KEY (ID_User) REFERENCES Usuario(ID_usuario),
    CONSTRAINT fk_notif_consulta FOREIGN KEY (ID_Consulta) REFERENCES Consulta(ID_Consulta)
);