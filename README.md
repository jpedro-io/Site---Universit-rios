# Site da Comissão de Transporte dos Universitários de Divisa Alegre - MG

Site com 4 páginas (Página inicial, Regras e Critérios, Universidades e Manual dos Universitários),
responsivo para PC e celular, com cabeçalho fixo contendo a logo (com contorno branco) em todas as
páginas, menu hambúrguer, animações de transição entre páginas e animação de aparecimento durante a
rolagem.

O clima (Open-Meteo) e a rota (Google Routes API) são consultados **pelo servidor**. Nenhuma chave
sai do servidor: o navegador só conversa com `/api/clima` e `/api/rota`.

---

## 1. Como rodar

Precisa apenas do Node.js 18 ou superior (não há dependências para instalar).

```bash
cd site-universitarios
node server.js
# abra http://localhost:3000
```

A porta pode ser mudada no `.env` (`PORT=3000`).

> Procurando "onde mexo para mudar tal coisa"? Veja o arquivo **GUIA-DE-EDICAO.md**:
> ele lista, item por item, qual arquivo e qual parte do código controla cada pedaço do site.

## 2. Arquivos

```
site-universitarios/
├── server.js            servidor HTTP (Node puro) + chamadas às APIs
├── .env                 chaves e configurações (NÃO publicar)
├── .env.example         modelo do .env
├── package.json         apenas o script "npm start"
└── public/
    ├── index.html           Página inicial (foto da van + clima + botão Rota para VCA)
    ├── regras.html          Regras e Critérios (lista e avisos)
    ├── universidades.html   7 universidades com foto, endereço, fundação e cursos
    ├── manual.html          Ferramentas úteis, cursos e documentos
    ├── css/style.css        Estilos e animações
    ├── js/main.js           Menu, transições, clima e rota
    └── img/                 Fotos extraídas do PDF + logo + favicon
```

## 3. A logo

A logo veio do PDF com fundo branco. Foram gerados dois arquivos:

- `img/logo.png` — logo com o fundo branco removido (transparente)
- `img/logo-contorno.png` — a mesma logo com contorno branco, usada no cabeçalho e no rodapé
  (é o que garante a leitura sobre o azul do cabeçalho e sobre a foto)

Se você tiver um arquivo original da logo em melhor resolução (PNG com transparência), basta
substituir os dois arquivos mantendo os mesmos nomes.

## 4. Fotos das universidades

Todas foram extraídas do PDF na resolução original. As do Anhanguera e do IFBA vinham pequenas no
PDF (203 x 152 px), então foram ampliadas e receberam leve nitidez extra. Para trocar por fotos
melhores, use os mesmos nomes:

`anhanguera.jpg`, `ifba.jpg`, `unex.jpg`, `unopar.jpg`, `fainor.jpg`, `fasa-uninassau.jpg`, `uesb.jpg`,
`van.jpg` (foto da van usada no fundo da página inicial).

## 5. Rotas: por que o botão precisa do Google Cloud configurado

O botão **Rota para VCA** chama `POST /api/rota`, que por sua vez chama a
**Routes API** (`routes.googleapis.com/directions/v2:computeRoutes`) com a chave guardada no `.env`.
A distância e o tempo exibidos são os que a API devolve, convertidos apenas de metros/segundos
para "km" e "h/min". Não existe valor fixo no código.

Testando a chave que estava no documento, o Google respondeu **403 - The caller does not have
permission** (e, nas APIs antigas, "You must enable Billing on the Google Cloud Project").
Para a rota oficial voltar a funcionar, no projeto `296970613434` do Google Cloud:

1. **Ativar o faturamento (Billing)** do projeto — a Plataforma Google Maps não atende sem isso
   (existe cota gratuita mensal por serviço; a Routes API Essentials tem 10.000 chamadas grátis/mês).
2. Em **APIs e serviços > Biblioteca**, habilitar **Routes API**.
3. Em **APIs e serviços > Credenciais > sua chave**, conferir as restrições:
   - **Restrições de aplicativo:** como a chamada é feita pelo servidor, use **Nenhuma** ou
     **Endereços IP** (com o IP do servidor). Se ficar **Referenciadores HTTP**, o servidor é bloqueado.
   - **Restrições de API:** marque apenas **Routes API**.
4. Reiniciar o servidor (`node server.js`).

### Estimativa enquanto o Google não responde

Com `ROTA_FALLBACK=true` (padrão), se o Google recusar a chamada o servidor calcula o trajeto com o
**OSRM/OpenStreetMap** e a tela mostra o aviso de que o número é uma estimativa, sem tráfego.
O rodapé do quadro sempre informa a fonte usada. Quando a chave do Google for liberada, o site passa
a mostrar o valor oficial sozinho, sem mexer em nada.

Para desligar essa estimativa, use `ROTA_FALLBACK=false` no `.env`.

Configurações relacionadas no `.env`:

| Variável | Para que serve |
|---|---|
| `ROTA_ORIGEM` / `ROTA_DESTINO` | Endereços usados na consulta ao Google |
| `ROTA_COM_TRAFEGO` | `true` = considera o tráfego em tempo real (SKU mais caro do Google) |
| `ROTA_ORIGEM_LAT/LON`, `ROTA_DESTINO_LAT/LON` | Coordenadas do cálculo alternativo (padrão: centro de Divisa Alegre e de Vitória da Conquista) |

Dica: se a van sai da esquina da prefeitura, o ideal é trocar `ROTA_ORIGEM` por
`Prefeitura de Divisa Alegre, MG` (ou usar as coordenadas exatas do ponto) para o tempo ficar
mais fiel ao trajeto real.

## 6. Clima

`GET /api/clima` chama `https://api.open-meteo.com/v1/forecast` para Vitória da Conquista
(`-14.8661, -40.8394`, fuso `America/Bahia`), com cache de 5 minutos. Não usa chave.
Mostra temperatura, sensação, descrição do tempo, umidade e vento.

## 7. Endpoints do servidor

| Rota | O que faz |
|---|---|
| `GET /api/clima` | Clima atual de Vitória da Conquista |
| `GET /api/rota` | Tempo e distância Divisa Alegre -> Vitória da Conquista |
| `GET /api/status` | Mostra o que está configurado (sem revelar nenhuma chave) |

Proteções já embutidas: limite de 30 chamadas por minuto por IP, cache (5 min clima / 10 min rota),
timeout de 12-15 s nas chamadas externas e uma função que apaga qualquer chave que apareça em
mensagens de erro antes de enviá-las ao navegador.

## 8. Segurança — leia antes de publicar

1. **Troque as duas credenciais.** A chave do Maps e a senha do banco Neon foram escritas dentro do
   PDF do projeto, então devem ser consideradas expostas. Gere uma chave nova no Google Cloud e
   troque a senha do banco no painel da Neon (isso invalida as antigas).
2. O `.env` está no `.gitignore`: não suba esse arquivo para o GitHub.
3. Ao publicar (Render, Railway, Fly.io, VPS), cadastre as variáveis de ambiente no painel do serviço
   em vez de subir o `.env`.
4. Se quiser, restrinja a chave do Maps por IP do servidor e apenas para a Routes API.
5. O banco Neon está configurado no `.env`, mas o site ainda não grava nada nele (não havia
   nenhuma funcionalidade de banco descrita no documento). Quando definirmos o que guardar
   (por exemplo, a lista de nomes do dia), a conexão já está pronta.

## 9. Publicar depois

Como não há dependências, qualquer serviço que rode Node funciona. Exemplos:

- **Render / Railway:** comando de start `node server.js`, variáveis de ambiente no painel.
- **VPS:** `node server.js` com o `.env` na pasta (use `pm2` ou `systemd` para manter no ar).

---

Feito a partir do documento "SITE DOS UNIVERSITÁRIOS DE DIVISA ALEGRE".
