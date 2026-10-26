-- CreateTable
CREATE TABLE `Usuario` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `papel` ENUM('ADMIN', 'OPERADOR') NOT NULL DEFAULT 'OPERADOR',
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organizacao` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organizacao_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contrato` (
    `id` VARCHAR(191) NOT NULL,
    `organizacaoId` VARCHAR(191) NOT NULL,
    `valorMensal` DECIMAL(12, 2) NOT NULL,
    `clausulas` JSON NOT NULL,
    `inicio` DATETIME(3) NOT NULL,
    `fim` DATETIME(3) NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `Contrato_organizacaoId_key`(`organizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lote` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `organizacaoId` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Equipamento` (
    `id` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `codigoBarrasInterno` VARCHAR(191) NOT NULL,
    `estado` ENUM('RECEBIDO', 'EM_TRIAGEM', 'EM_REPARO', 'RECICLADO', 'DESCARTADO') NOT NULL DEFAULT 'RECEBIDO',
    `loteId` VARCHAR(191) NOT NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Equipamento_codigoBarrasInterno_key`(`codigoBarrasInterno`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Movimentacao` (
    `id` VARCHAR(191) NOT NULL,
    `equipamentoId` VARCHAR(191) NOT NULL,
    `estadoAnterior` ENUM('RECEBIDO', 'EM_TRIAGEM', 'EM_REPARO', 'RECICLADO', 'DESCARTADO') NULL,
    `estadoNovo` ENUM('RECEBIDO', 'EM_TRIAGEM', 'EM_REPARO', 'RECICLADO', 'DESCARTADO') NOT NULL,
    `observacao` VARCHAR(191) NULL,
    `versao` INTEGER NOT NULL DEFAULT 1,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Contrato` ADD CONSTRAINT `Contrato_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `Organizacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lote` ADD CONSTRAINT `Lote_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `Organizacao`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Equipamento` ADD CONSTRAINT `Equipamento_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `Lote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Movimentacao` ADD CONSTRAINT `Movimentacao_equipamentoId_fkey` FOREIGN KEY (`equipamentoId`) REFERENCES `Equipamento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
