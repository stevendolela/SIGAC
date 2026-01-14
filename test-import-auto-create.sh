#!/bin/bash

# Test d'Import Bulk avec Auto-Création de TypeAffaire
# Ce script teste le nouvel endpoint avec des types d'affaires inexistants

set -e

echo "═══════════════════════════════════════════════════════════════════"
echo "🧪 TEST: Import en Masse avec Auto-Création des Types d'Affaires"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Configuration
API_URL="http://localhost:5210/api"
BACKEND_RUNNING=false

# Vérifie si le backend est accessible
echo "🔍 Vérification du backend..."
if curl -s "$API_URL/health" > /dev/null 2>&1 || curl -s "$API_URL/auth/login" > /dev/null 2>&1; then
    BACKEND_RUNNING=true
    echo "✅ Backend accessible sur $API_URL"
else
    echo "⚠️  Backend non accessible sur $API_URL"
    echo "   Assurez-vous que le backend s'exécute: dotnet run --project SIGAC.API"
    echo ""
    BACKEND_RUNNING=false
fi

echo ""

# 1️⃣ ÉTAPE 1: Login pour obtenir un token
echo "📝 ÉTAPE 1: Authentification..."
if [ "$BACKEND_RUNNING" = true ]; then
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"username":"admin","password":"Admin@2024!"}')
    
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null || echo "")
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo "❌ Authentification échouée"
        echo "   Réponse: $LOGIN_RESPONSE"
        exit 1
    fi
    
    echo "✅ Token obtenu: ${TOKEN:0:20}..."
    echo ""
fi

# 2️⃣ ÉTAPE 2: Préparer le CSV avec nouveaux types
echo "📝 ÉTAPE 2: Préparation des données d'import..."
cat > /tmp/import_test.json << 'EOF'
{
  "dossiers": [
    {
      "NumeroDossier": "2024-ADM-001",
      "Titre": "Demande administrative",
      "Description": "Demande de permis de construire",
      "TypeAffaire": "Administratif",
      "Priorite": "Normale",
      "Responsable": "admin",
      "Status": "Nouveau",
      "Documents": ""
    },
    {
      "NumeroDossier": "2024-COM-001",
      "Titre": "Contrat commercial",
      "Description": "Accord de partenariat",
      "TypeAffaire": "Commercial",
      "Priorite": "Haute",
      "Responsable": "admin",
      "Status": "Nouveau",
      "Documents": ""
    },
    {
      "NumeroDossier": "2024-MED-001",
      "Titre": "Dossier médical",
      "Description": "Consultation médicale",
      "TypeAffaire": "Médical",
      "Priorite": "Critique",
      "Responsable": "admin",
      "Status": "Nouveau",
      "Documents": ""
    },
    {
      "NumeroDossier": "2024-FIN-001",
      "Titre": "Financement projet",
      "Description": "Suivi budget",
      "TypeAffaire": "Financement projet",
      "Priorite": "Normale",
      "Responsable": "admin",
      "Status": "Nouveau",
      "Documents": ""
    }
  ]
}
EOF

echo "✅ Fichier préparé: /tmp/import_test.json"
echo "   Données: 4 dossiers"
echo "   Nouveaux types: Administratif, Commercial, Médical"
echo "   Types existants: Financement projet (à réutiliser)"
echo ""

# 3️⃣ ÉTAPE 3: Appeler l'endpoint d'import
if [ "$BACKEND_RUNNING" = true ]; then
    echo "📝 ÉTAPE 3: Appel de l'endpoint d'import..."
    IMPORT_RESPONSE=$(curl -s -X POST "$API_URL/Import/dossiers" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d @/tmp/import_test.json)
    
    echo "📤 Réponse de l'API:"
    echo "$IMPORT_RESPONSE" | jq '.' 2>/dev/null || echo "$IMPORT_RESPONSE"
    echo ""
    
    # Extraire les statistiques
    SUCCESS=$(echo "$IMPORT_RESPONSE" | jq -r '.success' 2>/dev/null)
    DOSSIERS=$(echo "$IMPORT_RESPONSE" | jq -r '.dossiersCreated' 2>/dev/null)
    TYPES=$(echo "$IMPORT_RESPONSE" | jq -r '.typeAffairesCreated | length' 2>/dev/null)
    
    if [ "$SUCCESS" = "true" ]; then
        echo "✅ Import réussi!"
        echo "   ✓ $DOSSIERS dossiers créés"
        echo "   ✓ $TYPES types d'affaires créés automatiquement"
    else
        echo "❌ Import échoué"
        exit 1
    fi
else
    echo "⚠️  Backend non accessible - test skippé"
    echo "   Vous pouvez tester manuellement avec:"
    echo "   curl -X POST \"http://localhost:5210/api/Import/dossiers\" \\"
    echo "     -H \"Authorization: Bearer <YOUR_TOKEN>\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d @/tmp/import_test.json"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "✅ Test terminé"
echo "═══════════════════════════════════════════════════════════════════"
