#!/bin/bash
NUMERO="5533987287901"
API_URL="http://localhost:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"
INSTANCE="boleto-manager"

MENSAGEM="*Boleto Manager*

Olá, David!

⚠️ Seu boleto vence em 2 dias!

*Valor:* R$ 129,90
*Vencimento:* 16/05/2026
*Referência:* Maio/2026

*Linha Digitável:*
34191.09008 63521.350403 41520.190003 1 00000012990

Pague em qualquer banco ou lotérica.

Obrigado por ser nosso cliente! 🙏"

curl -X POST "$API_URL/message/sendText/$INSTANCE" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"number\": \"$NUMERO\", \"text\": $(echo "$MENSAGEM" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"

echo ""
echo "✅ Mensagem enviada!"
