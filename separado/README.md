# Projeto 08 — Node.js e JSON Server

Projeto baseado no material `08-dwbe-node-json-server-phr`. Implementa os três CRUDs solicitados usando **JSON Server, HTML, CSS, JavaScript e REST Client**.

## CRUDs implementados

1. **Produtos de uma padaria:** criar, listar, editar e excluir produtos.
2. **Eventos de uma agência de eventos:** CRUD de eventos com relacionamento com cidades e atrações.
3. **Pacotes de uma agência de turismo:** CRUD de pacotes com relacionamento com cidade de origem, cidade de destino e promoção.

Também há cadastros de apoio para cidades, atrações e promoções, necessários para selecionar os relacionamentos nos formulários.

## Estrutura

```text
Projeto_08_Node_JSON_Server/
├── db/
│   └── db.json
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── requests/
│   └── teste.http
├── .gitignore
├── package.json
└── README.md
```

## Como executar no GitHub Codespaces

No terminal, na raiz do projeto:

```bash
npm install
npm run api
```

O JSON Server ficará disponível na porta **3000**. Na aba **Ports** do Codespaces, encaminhe a porta 3000 e deixe-a pública, conforme orientação do material.

Para abrir a interface, inicie o Live Server pelo arquivo `public/index.html`. A aplicação detecta automaticamente o endereço da API na porta 3000 quando estiver em `*.app.github.dev`. Em ambiente local, usa `localhost:3000`.

> Se estiver no Codespaces, a porta 3000 deve estar acessível para a página do Live Server conseguir consultar a API.

## Testar com REST Client

Instale a extensão **REST Client** no VS Code. Abra `requests/teste.http` e clique em **Send Request** acima de cada requisição.

O arquivo contém exemplos de:
- GET para listar e buscar por id;
- POST para criar;
- PATCH para atualizar parcialmente;
- DELETE para excluir;
- consultas de relacionamento.

## Endpoints

| Recurso | Endpoint |
|---|---|
| Produtos | `/produtos` |
| Eventos | `/eventos` |
| Pacotes | `/pacotes` |
| Cidades | `/cidades` |
| Atrações | `/atracoes` |
| Promoções | `/promocoes` |

## Relacionamentos

- Cada evento possui `cidadeId` e `atracaoIds`.
- Cada pacote possui `cidadeOrigemId`, `cidadeDestinoId` e `promocaoId`.
- As cidades, atrações e promoções ficam em coleções próprias no `db.json`, permitindo relacionar os registros por seus ids.

## Observações

- Os registros são dados fictícios para fins acadêmicos.
- O JSON Server persiste as alterações diretamente no arquivo `db/db.json`.
- O projeto utiliza JSON Server `1.0.0-beta.15`, versão indicada no material de referência.
- O botão excluir pede confirmação antes de apagar o registro.
- Os relacionamentos são armazenados por identificadores. O cliente apresenta os nomes correspondentes nas telas.
