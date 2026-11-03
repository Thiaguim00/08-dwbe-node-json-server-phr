const collections = {
  produtos: { endpoint: "produtos", title: "Produtos da padaria", description: "Cadastre, consulte, edite e exclua os produtos da padaria.", eyebrow: "CRUD · EXERCÍCIO 1" },
  eventos: { endpoint: "eventos", title: "Eventos da agência", description: "Gerencie eventos e relacione cada evento a uma cidade e suas atrações.", eyebrow: "CRUD · EXERCÍCIO 2" },
  pacotes: { endpoint: "pacotes", title: "Pacotes de viagem", description: "Gerencie pacotes relacionando origem, destino e promoção.", eyebrow: "CRUD · EXERCÍCIO 3" },
  apoio: { endpoint: "cidades", title: "Cadastros de apoio", description: "Cadastre cidades, atrações e promoções usadas nos relacionamentos.", eyebrow: "DADOS RELACIONADOS" }
};

const state = { tab: "produtos", records: [], editingId: null, support: {} };
const $ = (id) => document.getElementById(id);
const money = (n) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function apiBase() {
  const host = window.location.hostname;
  if (host.endsWith(".app.github.dev")) {
    return `${window.location.protocol}//${host.replace(/-\d+\.app\.github\.dev$/, "-3000.app.github.dev")}`;
  }
  return `${window.location.protocol}//${host}:3000`;
}
const API = apiBase();

async function request(path, options = {}) {
  const response = await fetch(`${API}/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Erro ${response.status}: ${detail || response.statusText}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  window.setTimeout(() => el.classList.remove("show"), 2600);
}

function setApiStatus(online, message) {
  $("status-text").textContent = message;
  $("status-dot").parentElement.className = `api-status ${online ? "online" : "offline"}`;
}

async function loadSupport() {
  const [cidades, atracoes, promocoes] = await Promise.all([
    request("cidades"), request("atracoes"), request("promocoes")
  ]);
  state.support = { cidades, atracoes, promocoes };
}

async function loadCounts() {
  const [produtos, eventos, pacotes] = await Promise.all([
    request("produtos"), request("eventos"), request("pacotes")
  ]);
  $("count-produtos").textContent = produtos.length;
  $("count-eventos").textContent = eventos.length;
  $("count-pacotes").textContent = pacotes.length;
}

async function loadRecords() {
  const config = collections[state.tab];
  $("module-title").textContent = config.title;
  $("module-description").textContent = config.description;
  $("module-eyebrow").textContent = config.eyebrow;
  $("record-list").innerHTML = '<div class="loading">Carregando dados...</div>';
  try {
    if (state.tab === "apoio") {
      await loadSupport();
      state.records = [
        ...state.support.cidades.map(x => ({...x, _kind:"cidade"})),
        ...state.support.atracoes.map(x => ({...x, _kind:"atracao"})),
        ...state.support.promocoes.map(x => ({...x, _kind:"promocao"}))
      ];
    } else {
      state.records = await request(config.endpoint);
    }
    setApiStatus(true, "API conectada · porta 3000");
    await loadCounts();
    renderRecords();
    renderFilter();
  } catch (error) {
    setApiStatus(false, "API indisponível");
    $("record-list").innerHTML = `<div class="empty">Não foi possível acessar a API em ${API}.<br>Inicie o JSON Server com <b>npm run api</b> e atualize a página.<br><small>${escapeHtml(error.message)}</small></div>`;
  }
}

function renderFilter() {
  const select = $("filter-select");
  const values = state.tab === "produtos"
    ? [...new Set(state.records.map(x => x.categoria))]
    : state.tab === "apoio" ? ["Cidades","Atrações","Promoções"] : [];
  select.innerHTML = '<option value="">Todas as categorias</option>' + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  select.style.display = values.length ? "block" : "none";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
function cityName(id) { return state.support.cidades?.find(x => x.id === id)?.nome || "Cidade não informada"; }
function attractionNames(ids = []) { return ids.map(id => state.support.atracoes?.find(x => x.id === id)?.nome || id).join(", ") || "Sem atrações"; }
function promotionName(id) { return state.support.promocoes?.find(x => x.id === id)?.nome || "Sem promoção"; }

function cardFor(item) {
  if (state.tab === "produtos") return `
    <article class="record-card"><div class="record-card-top"><span class="record-tag">${escapeHtml(item.categoria)}</span><span class="record-tag">Estoque: ${item.estoque}</span></div>
    <h3>${escapeHtml(item.nome)}</h3><p>${escapeHtml(item.descricao)}</p><div class="record-price">${money(item.preco)}</div>
    <div class="record-meta">Peso/medida: ${escapeHtml(item.peso || "Não informado")}</div>${actions(item.id)}</article>`;
  if (state.tab === "eventos") return `
    <article class="record-card"><div class="record-card-top"><span class="record-tag">${escapeHtml(item.data)}</span><span class="record-tag">${escapeHtml(cityName(item.cidadeId))}</span></div>
    <h3>${escapeHtml(item.nome)}</h3><p>${escapeHtml(item.descricao)}</p><div class="record-meta"><b>Local:</b> ${escapeHtml(item.local)}<br><b>Atrações:</b> ${escapeHtml(attractionNames(item.atracaoIds))}</div>${actions(item.id)}</article>`;
  if (state.tab === "pacotes") return `
    <article class="record-card"><div class="record-card-top"><span class="record-tag">${item.duracaoDias} dias</span><span class="record-tag">${escapeHtml(promotionName(item.promocaoId))}</span></div>
    <h3>${escapeHtml(item.nome)}</h3><p>${escapeHtml(item.descricao)}</p><div class="record-price">${money(item.preco)}</div>
    <div class="record-meta"><b>Origem:</b> ${escapeHtml(cityName(item.cidadeOrigemId))}<br><b>Destino:</b> ${escapeHtml(cityName(item.cidadeDestinoId))}</div>${actions(item.id)}</article>`;
  const kind = item._kind;
  const title = kind === "cidade" ? item.nome : item.nome;
  const category = kind === "cidade" ? `${item.estado} · ${item.pais}` : kind === "atracao" ? item.tipo : `${item.desconto}% de desconto`;
  return `<article class="record-card"><div class="record-card-top"><span class="record-tag">${kind === "cidade" ? "Cidade" : kind === "atracao" ? "Atração" : "Promoção"}</span><span class="record-tag">${escapeHtml(category)}</span></div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(item.descricao || "")}</p>${actions(item.id, kind)}</article>`;
}
function actions(id, kind = "") {
  return `<div class="card-actions"><button class="small-button edit-button" data-edit="${escapeHtml(id)}" data-kind="${kind}">Editar</button><button class="small-button delete-button" data-delete="${escapeHtml(id)}" data-kind="${kind}">Excluir</button></div>`;
}

function renderRecords() {
  const term = $("search-input").value.toLowerCase().trim();
  const filter = $("filter-select").value;
  let records = state.records.filter(item => JSON.stringify(item).toLowerCase().includes(term));
  if (state.tab === "produtos" && filter) records = records.filter(item => item.categoria === filter);
  if (state.tab === "apoio" && filter) {
    const map = {"Cidades":"cidade","Atrações":"atracao","Promoções":"promocao"};
    records = records.filter(item => item._kind === map[filter]);
  }
  $("record-list").innerHTML = records.length ? records.map(cardFor).join("") : '<div class="empty">Nenhum registro encontrado.</div>';
}

function field(label, name, value = "", type = "text", opts = {}) {
  const full = opts.full ? " full-width" : "";
  if (opts.select) {
    const options = opts.select.map(o => {
      const selected = opts.multiple
        ? Array.isArray(value) && value.map(String).includes(String(o.value))
        : String(o.value) === String(value);
      return `<option value="${escapeHtml(o.value)}" ${selected ? "selected" : ""}>${escapeHtml(o.label)}</option>`;
    }).join("");
    return `<div class="field${full}"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}" ${opts.multiple ? "multiple" : ""} ${opts.required ? "required" : ""}>${options}</select></div>`;
  }
  if (type === "textarea") return `<div class="field${full}"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}">${escapeHtml(value)}</textarea></div>`;
  return `<div class="field${full}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${opts.required ? "required" : ""} ${opts.step ? `step="${opts.step}"` : ""} ${opts.min !== undefined ? `min="${opts.min}"` : ""}></div>`;
}

function optionsFrom(items, labelFn) {
  return [{value:"",label:"Selecione..."} , ...items.map(item => ({value:item.id,label:labelFn(item)}))];
}

function formMarkup(item = {}, kind = "") {
  if (state.tab === "produtos") return [
    field("Nome do produto","nome",item.nome,"text",{required:true}),
    field("Categoria","categoria",item.categoria),
    field("Preço (R$)","preco",item.preco ?? "","number",{required:true,step:"0.01",min:0}),
    field("Estoque","estoque",item.estoque ?? 0,"number",{required:true,min:0}),
    field("Peso / medida","peso",item.peso),
    field("Descrição","descricao",item.descricao,"textarea",{full:true})
  ].join("");
  if (state.tab === "eventos") return [
    field("Nome do evento","nome",item.nome,"text",{required:true}),
    field("Data","data",item.data,"date",{required:true}),
    field("Local","local",item.local),
    field("Cidade","cidadeId",item.cidadeId,"text",{required:true,select:optionsFrom(state.support.cidades,c=>`${c.nome} - ${c.estado}`)}),
    field("Atrações","atracaoIds",item.atracaoIds || [],"text",{select:optionsFrom(state.support.atracoes,a=>a.nome),multiple:true,full:true}),
    field("Descrição","descricao",item.descricao,"textarea",{full:true})
  ].join("");
  if (state.tab === "pacotes") return [
    field("Nome do pacote","nome",item.nome,"text",{required:true}),
    field("Cidade de origem","cidadeOrigemId",item.cidadeOrigemId,"text",{required:true,select:optionsFrom(state.support.cidades,c=>`${c.nome} - ${c.estado}`)}),
    field("Cidade de destino","cidadeDestinoId",item.cidadeDestinoId,"text",{required:true,select:optionsFrom(state.support.cidades,c=>`${c.nome} - ${c.estado}`)}),
    field("Promoção","promocaoId",item.promocaoId,"text",{select:optionsFrom(state.support.promocoes,p=>`${p.nome} (${p.desconto}%)`)}),
    field("Duração (dias)","duracaoDias",item.duracaoDias ?? 1,"number",{required:true,min:1}),
    field("Preço (R$)","preco",item.preco ?? "","number",{required:true,min:0,step:"0.01"}),
    field("Descrição","descricao",item.descricao,"textarea",{full:true})
  ].join("");
  if (kind === "cidade") return [
    field("Nome da cidade","nome",item.nome,"text",{required:true}),
    field("Estado","estado",item.estado,"text",{required:true}),
    field("País","pais",item.pais || "Brasil","text",{required:true})
  ].join("");
  if (kind === "atracao") return [
    field("Nome da atração","nome",item.nome,"text",{required:true}),
    field("Tipo","tipo",item.tipo,"text",{required:true}),
    field("Descrição","descricao",item.descricao,"textarea",{full:true})
  ].join("");
  return [
    field("Nome da promoção","nome",item.nome,"text",{required:true}),
    field("Desconto (%)","desconto",item.desconto ?? 0,"number",{required:true,min:0,max:100}),
    field("Descrição","descricao",item.descricao,"textarea",{full:true})
  ].join("");
}

function openForm(item = null, kind = "") {
  state.editingId = item?.id ?? null;
  state.editingKind = kind || (state.tab === "apoio" ? "cidade" : state.tab);
  $("dialog-title").textContent = item ? "Editar cadastro" : "Novo cadastro";
  $("form-error").textContent = "";
  $("form-fields").innerHTML = formMarkup(item || {}, kind);
  $("record-dialog").showModal();
}
function closeForm() { $("record-dialog").close(); }

function selectedValues(select) {
  return [...select.selectedOptions].map(o => o.value).filter(Boolean);
}

function readForm() {
  const form = new FormData($("record-form"));
  const get = key => form.get(key);
  if (state.tab === "produtos") return {
    nome:get("nome").trim(), categoria:get("categoria").trim(), preco:Number(get("preco")),
    estoque:Number(get("estoque")), peso:get("peso").trim(), descricao:get("descricao").trim()
  };
  if (state.tab === "eventos") return {
    nome:get("nome").trim(), data:get("data"), local:get("local").trim(), cidadeId:get("cidadeId"),
    atracaoIds:selectedValues($("f-atracaoIds")), descricao:get("descricao").trim()
  };
  if (state.tab === "pacotes") return {
    nome:get("nome").trim(), cidadeOrigemId:get("cidadeOrigemId"), cidadeDestinoId:get("cidadeDestinoId"),
    promocaoId:get("promocaoId") || null, duracaoDias:Number(get("duracaoDias")), preco:Number(get("preco")), descricao:get("descricao").trim()
  };
  const kind = state.editingKind;
  if (kind === "cidade") return {nome:get("nome").trim(),estado:get("estado").trim(),pais:get("pais").trim()};
  if (kind === "atracao") return {nome:get("nome").trim(),tipo:get("tipo").trim(),descricao:get("descricao").trim()};
  return {nome:get("nome").trim(),desconto:Number(get("desconto")),descricao:get("descricao").trim()};
}

async function saveRecord(event) {
  event.preventDefault();
  try {
    const payload = readForm();
    if (state.tab === "eventos" && !payload.cidadeId) throw new Error("Selecione a cidade do evento.");
    if (state.tab === "pacotes" && (!payload.cidadeOrigemId || !payload.cidadeDestinoId)) throw new Error("Selecione as cidades de origem e destino.");
    let endpoint = collections[state.tab].endpoint;
    if (state.tab === "apoio") endpoint = state.editingKind === "cidade" ? "cidades" : state.editingKind === "atracao" ? "atracoes" : "promocoes";
    const method = state.editingId ? "PATCH" : "POST";
    const path = state.editingId ? `${endpoint}/${state.editingId}` : endpoint;
    await request(path,{method,body:JSON.stringify(payload)});
    closeForm();
    toast(state.editingId ? "Cadastro atualizado com sucesso." : "Cadastro criado com sucesso.");
    await loadRecords();
  } catch(error) {
    $("form-error").textContent = error.message || "Não foi possível salvar.";
  }
}

async function deleteRecord(id, kind = "") {
  const item = state.records.find(x => x.id === id);
  const nome = item?.nome || item?.titulo || "este registro";
  if (!confirm(`Deseja realmente excluir "${nome}"?`)) return;
  try {
    let endpoint = collections[state.tab].endpoint;
    if (state.tab === "apoio") endpoint = kind === "cidade" ? "cidades" : kind === "atracao" ? "atracoes" : "promocoes";
    await request(`${endpoint}/${id}`,{method:"DELETE"});
    toast("Cadastro excluído.");
    await loadRecords();
  } catch(error) { toast(error.message); }
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll(".tab").forEach(button => button.classList.toggle("active",button.dataset.tab===tab));
  $("search-input").value = "";
  loadRecords();
}

$("new-record").addEventListener("click",async()=>{
  if(state.tab==="apoio") {
    const kind=prompt("Qual cadastro deseja criar? Digite: cidade, atracao ou promocao","cidade");
    if(!["cidade","atracao","promocao"].includes(kind)) return;
    await loadSupport();
    openForm(null,kind);
  } else {
    if(state.tab==="eventos" || state.tab==="pacotes") await loadSupport();
    openForm();
  }
});
$("close-dialog").addEventListener("click",closeForm);
$("cancel-dialog").addEventListener("click",closeForm);
$("record-form").addEventListener("submit",saveRecord);
$("refresh-button").addEventListener("click",loadRecords);
$("search-input").addEventListener("input",renderRecords);
$("filter-select").addEventListener("change",renderRecords);
document.querySelectorAll(".tab").forEach(button=>button.addEventListener("click",()=>switchTab(button.dataset.tab)));
$("record-list").addEventListener("click",async event=>{
  const edit=event.target.closest("[data-edit]");
  const del=event.target.closest("[data-delete]");
  if(edit) {
    const kind=edit.dataset.kind;
    if(state.tab==="apoio") {
      await loadSupport();
      const endpoint=kind==="cidade"?"cidades":kind==="atracao"?"atracoes":"promocoes";
      const item=await request(`${endpoint}/${edit.dataset.edit}`);
      openForm(item,kind);
    } else {
      if(state.tab==="eventos"||state.tab==="pacotes") await loadSupport();
      const item=state.records.find(x=>String(x.id)===String(edit.dataset.edit));
      if(item) openForm(item);
    }
  }
  if(del) deleteRecord(del.dataset.delete,del.dataset.kind);
});

(async function init(){
  $("api-port").textContent = new URL(API).port || "3000";
  await loadRecords();
})();
