function gc-api {
  Invoke-RestMethod -Method Get -Uri 'http://localhost:3000/saude'
}

function gc-login {
  $email = Read-Host 'E-mail [admin@greencode.local]'
  if ([string]::IsNullOrWhiteSpace($email)) { $email = 'admin@greencode.local' }
  $senha = Read-Host 'Senha [greencode123]'
  if ([string]::IsNullOrWhiteSpace($senha)) { $senha = 'greencode123' }

  $resposta = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/login' `
    -ContentType 'application/json' `
    -Body (@{ email = $email; senha = $senha } | ConvertTo-Json)
  $global:gcToken = $resposta.token
  Write-Host 'Login realizado. Token salvo nesta sessão do terminal.'
}

function gc-org {
  param([string]$Nome, [string]$Cnpj)
  if (-not $global:gcToken) { throw 'Faça login primeiro com gc-login.' }
  if ([string]::IsNullOrWhiteSpace($Nome)) { $Nome = Read-Host 'Nome da organização' }
  if ([string]::IsNullOrWhiteSpace($Cnpj)) { $Cnpj = Read-Host 'CNPJ (14 dígitos)' }

  $resposta = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/organizacoes' `
    -Headers @{ Authorization = "Bearer $global:gcToken" } `
    -ContentType 'application/json' `
    -Body (@{ nome = $Nome; cnpj = $Cnpj } | ConvertTo-Json)
  $global:gcOrganizacaoId = $resposta.id
  $resposta
}

function gc-contrato {
  param([string]$OrganizacaoId)
  if (-not $global:gcToken) { throw 'Faça login primeiro com gc-login.' }
  if ([string]::IsNullOrWhiteSpace($OrganizacaoId)) {
    $OrganizacaoId = $global:gcOrganizacaoId
  }
  if ([string]::IsNullOrWhiteSpace($OrganizacaoId)) {
    $OrganizacaoId = Read-Host 'ID da organização'
  }
  $valorTexto = Read-Host 'Valor mensal'
  $valor = [double]::Parse($valorTexto, [cultureinfo]::CurrentCulture)
  $clausulas = @{ coleta = 'Mensal'; destino = 'Reciclagem certificada' }

  Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/contratos' `
    -Headers @{ Authorization = "Bearer $global:gcToken" } `
    -ContentType 'application/json' `
    -Body (@{
      organizacaoId = $OrganizacaoId
      valorMensal = $valor
      clausulas = $clausulas
      inicio = (Get-Date).ToUniversalTime().ToString('o')
    } | ConvertTo-Json -Depth 5)
}

function gc-lote {
  param([string]$OrganizacaoId)
  if (-not $global:gcToken) { throw 'Faça login primeiro com gc-login.' }
  if ([string]::IsNullOrWhiteSpace($OrganizacaoId)) {
    $OrganizacaoId = $global:gcOrganizacaoId
  }
  if ([string]::IsNullOrWhiteSpace($OrganizacaoId)) {
    $OrganizacaoId = Read-Host 'ID da organização'
  }
  $nomeLote = Read-Host 'Nome do lote'
  $descricao = Read-Host 'Descrição do equipamento'
  $codigo = Read-Host 'Código de barras interno (único)'

  $resposta = Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/lotes' `
    -Headers @{ Authorization = "Bearer $global:gcToken" } `
    -ContentType 'application/json' `
    -Body (@{
      organizacaoId = $OrganizacaoId
      nome = $nomeLote
      equipamentos = @(@{ descricao = $descricao; codigoBarrasInterno = $codigo })
    } | ConvertTo-Json -Depth 5)
  $equipamento = $resposta.equipamentos[0]
  $global:gcEquipamentoId = $equipamento.id
  $global:gcVersaoEquipamento = $equipamento.versao
  $resposta
}

function gc-estado {
  param([string]$EquipamentoId, [int]$Versao = 0)
  if (-not $global:gcToken) { throw 'Faça login primeiro com gc-login.' }
  if ([string]::IsNullOrWhiteSpace($EquipamentoId)) {
    $EquipamentoId = $global:gcEquipamentoId
  }
  if ([string]::IsNullOrWhiteSpace($EquipamentoId)) {
    $EquipamentoId = Read-Host 'ID do equipamento'
  }
  if ($Versao -lt 1) { $Versao = $global:gcVersaoEquipamento }
  if ($Versao -lt 1) { $Versao = [int](Read-Host 'Versão atual do equipamento') }
  $estado = Read-Host 'Novo estado (EM_TRIAGEM, EM_REPARO, RECICLADO ou DESCARTADO)'
  $observacao = Read-Host 'Observação (opcional)'

  $corpo = @{ estado = $estado; versao = $Versao }
  if (-not [string]::IsNullOrWhiteSpace($observacao)) {
    $corpo.observacao = $observacao
  }
  $resposta = Invoke-RestMethod -Method Patch `
    -Uri "http://localhost:3000/equipamentos/$EquipamentoId/estado" `
    -Headers @{ Authorization = "Bearer $global:gcToken" } `
    -ContentType 'application/json' `
    -Body ($corpo | ConvertTo-Json)
  $global:gcEquipamentoId = $resposta.id
  $global:gcVersaoEquipamento = $resposta.versao
  $resposta
}
