param(
    [string]$Token
)

$headers = @{
    Authorization = "token $Token"
    Accept = "application/vnd.github.v3+json"
}

# Obtener usuario
try {
    $user = Invoke-RestMethod -Uri "https://api.github.com/user" -Headers $headers
    Write-Output "Usuario: $($user.login)"
    
    # Verificar si el repo existe
    try {
        $existing = Invoke-RestMethod -Uri "https://api.github.com/repos/$($user.login)/educa-solutions" -Headers $headers
        Write-Output "El repositorio ya existe: $($existing.html_url)"
        return $existing.html_url
    } catch {
        Write-Output "Creando repositorio..."
    }
    
    # Crear repositorio
    $body = @{
        name = "educa-solutions"
        description = "SaaS para gestión educativa con generación de horarios"
        private = $false
        auto_init = $false
    } | ConvertTo-Json
    
    $repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Output "Repositorio creado: $($repo.html_url)"
    return $repo.html_url
    
} catch {
    Write-Error "Error: $_"
    return $null
}
