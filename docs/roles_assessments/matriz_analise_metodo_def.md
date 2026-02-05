# Matriz de Análise - Método DEF

O Teste DEF sempre tem:

- **5 macro-categorias**

- **X critérios por categoria**

- **Nota 0 a 3 por critério**

- **Comentários padrão selecionáveis**

- **Comentário livre adicional (texto)**

- **Registro por reunião** (isso permite evolução do closer ao longo do tempo)

Aqui vai o **modelo JSON** da estrutura do teste (esqueleto):

```json
{
  "def_assessment": {
    "version": "1.0",
    "macro_categories": [
      {
        "id": "whatsapp",
        "label": "Whatsapp",
        "max_score": 3,
        "criteria": [
          "Recuo Estratégico",
          "Usou Framework de Perguntas?",
          "Jab, Jab, Jab, Direto",
          "Áudio",
          "Agendamento",
          "Cumprimento do Agendamento",
          "Explicação do porquê da ligação",
          "SLA"
        ],
        "comments": [
          "Não fez Recuo Estratégico",
          "Não usou Framework de Perguntas",
          "Não usou Jab Direto",
          "Não pediu pra mandar áudio",
          "Áudio fora de padrão",
          "Não fez Agendamento",
          "Não cumpriu Agendamento",
          "Não sou explicar o porquê da ligação",
          "Violou SLA",
          "Faltaram Jabs",
          "Jabs excedentes"
        ]
      },
      {
        "id": "descoberta",
        "label": "Descoberta",
        "max_score": 3,
        "criteria": [
          "Recuo Estratégico + Parafrasear",
          "Perguntas de Situação",
          "Perguntas de Motivação",
          "Perguntas de Impeditivo",
          "Usou Framework de Perguntas?",
          "Investigação de Red Flag(s)",
          "Aumento de Limiar de Dor",
          "Extração de Dor/Desejo/Objetivo Principal",
          "Condução natural (diálogo)",
          "Capacidade de se conectar",
          "Escuta Ativa",
          "Acordo de Sinceridade",
          "Não Vendeu na Descoberta"
        ],
        "comments": [
          "Não fez Recuo Estratégico",
          "Não Parafraseou",
          "Fez poucas Perguntas Situação",
          "Fez poucas Perguntas Impeditivo",
          "Fez poucas Perguntas Motivação",
          "Não usou Framework",
          "Induziu Lead em alguma Resposta",
          "Não aumentou limiar de dor",
          "Não mapeou Red Flag",
          "Não extraiu objetivo/dor/desejo",
          "Deixou passar alguma Red Flag",
          "Não mapeou Rotina",
          "Interrompeu o lead",
          "Falou mais do que ouviu",
          "Não mapeou decisor",
          "Não fez acordo",
          "Vendeu na descoberta",
          "Comunicação mecânica",
          "Não fez pergunta termômetro",
          "Não conseguiu gerar conexão"
        ]
      },
      {
        "id": "encantamento",
        "label": "Encantamento",
        "max_score": 3,
        "criteria": [
          "Pergunta de Abertura",
          "Organização por Tópicos",
          "CTA por tópico",
          "Variação de CTA",
          "Uso de Analogias",
          "Uso de Argumentos Racionais",
          "Uso de Argumentos Emocionais",
          "Adaptação do discurso à dor",
          "Pergunta de Verificação",
          "Isolamento de Variáveis",
          "Criação do Plano de Ação",
          "Lead conhece o Expert?"
        ],
        "comments": [
          "Não fez Pergunta de Abertura",
          "Não usou Estrutura de Diálogo",
          "Apresentação genérica",
          "Não criou Plano de Ação",
          "Não varia CTAs",
          "Demora para fazer CTA",
          "Não varia forma que argumenta",
          "Usou apenas elementos racionais",
          "Usou apenas elementos emocionais",
          "Não usou analogia",
          "Virou um monólogo",
          "Não fez Pergunta de Verificação",
          "Não isolou variáveis",
          "Apresentou descrevendo, pouca persuasão"
        ]
      },
      {
        "id": "fechamento",
        "label": "Fechamento",
        "max_score": 3,
        "criteria": [
          "Uso de Ancoragem",
          "CTA de Preço",
          "Fechamento Presumido",
          "Fechamento Acompanhado"
        ],
        "comments": [
          "Não usou Ancoragem",
          "Uso errado de Ancoragem",
          "Não fez CTA",
          "Não fez Fechamento Presumido",
          "Confirmação de pagamento antes da hora",
          "Não teve voz de comando"
        ]
      },
      {
        "id": "objeções",
        "label": "Contorno de Objeções",
        "max_score": 3,
        "criteria": [
          "Mostrou Empatia",
          "Alteração de Voz",
          "Uso de Perguntas Abertas e Reflexivas",
          "Argumentos de Contorno"
        ],
        "comments": [
          "Não demonstrou empatia",
          "Alterou tom de voz",
          "Não usou framework de objeções",
          "Não fez perguntas boas",
          "Não teve repertório",
          "Aceitou passivamente",
          "Não identificou objeção real vs não real",
          "Virou vendedor insistente",
          "Não teve domínio da situação"
        ]
      }
    ]
  }
}

```



# ✅ 2. Cálculo da nota por macro-categoria

Para cada categoria:

```markdown
categoria_score = soma_das_notas / (n_criterios * 3)
```

Resultado fica em **0,00 a 1,00**, ideal pro gráfico.



# ✅ 3. Gráfico RADAR das 5 categorias

Formato:

```
Whatsapp: 0–3
Descoberta: 0–3
Encantamento: 0–3
Fechamento: 0–3
Objeções: 0–3

```

Exemplo:

```
{
  "radar_chart": {
    "type": "radar",
    "max_value": 3,
    "categories": ["Whatsapp", "Descoberta", "Encantamento", "Fechamento", "Objeções"],
    "values": [2.1, 1.4, 1.9, 1.2, 1.7]
  }
}

```

Se quiser comparar ao longo das semanas, adiciona datasets:

- dataset 1 = Reunião atual

- dataset 2 = Média das últimas 30 reuniões

- dataset 3 = Meta interna (ex.: 2,5)



# 🔥 4. Outras Análises Inteligentes (super úteis no SaaS)

### **1\. Análise de Gargalos do Método**

Ordenar categorias por nota da menor para maior →\
Mostra exatamente onde o vendedor quebra a venda.

---

### **2\. “Assinatura DEF do Vendedor”**

Cada closer tende a ter um padrão, por exemplo:

| Categoria | Padrão | Interpretação | 
|---|---|---|
| WhatsApp | Forte | Boa prévia | 
| Descoberta | Fraco | Quebra a venda antes da hora | 
| Encantamento | Forte | Sabe apresentar | 
| Fechamento | Fraco | Não captura valor | 
| Objeções | Médio | Precisa treino | 

Isso permite criar **clusters**:

- “Fechador que não descobre”

- “Conector com pouco método”

- “Executor mecânico”

- “Técnico com baixa empatia”



### **3\. Linha do Tempo (DEVE existi no SaaS)**

Gráfico por categoria mostrando evolução semanal:

```
Whatsapp: 1.4 → 1.8 → 2.3 → 2.5
Descoberta: 0.9 → 1.3 → 1.5 → 1.5
...
```

Mostra se o treinamento realmente está funcionando.



### **4\. Heatmap por critério**

Tabela tipo:

| Critério | Média | % abaixo de 2 | 
|---|---|---|
| Perguntas de Impeditivo | 1\.2 | 77% | 
| Red Flags | 0\.9 | 82% | 
| Aumento de Dor | 0\.8 | 90% | 

### **5\. Resultados filtrados por tipo de lead**

Segmentações:

- lead quente / frio

- inbound / outbound

- produto 1 / produto 2

- ticket baixo / alto

Isso permite insights como:

“Encantamento funciona com leads inbound, mas derrapa com outbound.”