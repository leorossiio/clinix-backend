import { criarRepositoriosEmMemoria } from '../../src/infrastructure/memoria/repositorios.js';
import { verificarContratoDosRepositorios } from './repositorios.contrato.js';

verificarContratoDosRepositorios('memória', criarRepositoriosEmMemoria);
