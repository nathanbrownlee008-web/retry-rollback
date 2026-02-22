const $ = (id) => document.getElementById(id);

function getData(key){
  const d = localStorage.getItem(key);
  return d ? JSON.parse(d) : [];
}
function saveData(key, rows){
  localStorage.setItem(key, JSON.stringify(rows));
}

const state = {
  datasets: [],
  current: null,
  raw: [],
  columns: []
};

async function loadDataset(slug){
  const ds = state.datasets.find(d=>d.slug===slug);
  if(!ds) return;

  state.current = ds;

  try {
    const res = await fetch(ds.file, {cache:"no-store"});
    if(!res.ok) throw new Error("Fetch failed");

    const json = await res.json();

    const key = slug.replace(/-/g,"_")+"_data";
    const stored = getData(key);

    state.raw = stored.length ? stored : (json.rows || json);
    state.columns = state.raw.length ? Object.keys(state.raw[0]) : [];

  } catch(e){
    console.error("Dataset load error:", e);
    state.raw = [];
    state.columns = [];
  }

  render();
}

function render(){
  const thead = $("tbl").querySelector("thead");
  const tbody = $("tbl").querySelector("tbody");
  thead.innerHTML="";
  tbody.innerHTML="";

  if(!state.columns.length) return;

  const trh = document.createElement("tr");
  state.columns.forEach(c=>{
    const th=document.createElement("th");
    th.textContent=c;
    trh.appendChild(th);
  });
  thead.appendChild(trh);

  state.raw.forEach(r=>{
    const tr=document.createElement("tr");
    tr.onclick=()=>openDetails(r);
    state.columns.forEach(c=>{
      const td=document.createElement("td");
      td.textContent=r[c] ?? "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function openDetails(row){
  $("d_body").innerHTML="";
  Object.keys(row).forEach(k=>{
    const p=document.createElement("div");
    p.textContent=k+": "+row[k];
    $("d_body").appendChild(p);
  });

  const edit=document.createElement("button");
  edit.className="btn";
  edit.textContent="Edit";
  edit.onclick=()=>{
    $("details").close();
    openFormEditor(row);
  };
  $("d_body").appendChild(edit);

  $("details").showModal();
}

function openFormEditor(row=null){
  const slug = state.current.slug;
  const key = slug.replace(/-/g,"_")+"_data";
  const data = getData(key);

  const container=document.createElement("div");
  container.className="card";
  container.style.margin="12px";
  container.style.padding="12px";

  state.columns.forEach(col=>{
    const label=document.createElement("label");
    label.textContent=col;
    container.appendChild(label);

    const input=document.createElement("input");
    input.value=row? (row[col] ?? ""):"";
    input.dataset.col=col;
    input.style.width="100%";
    input.style.marginBottom="8px";
    container.appendChild(input);
  });

  const saveBtn=document.createElement("button");
  saveBtn.className="btn";
  saveBtn.textContent=row?"Save":"Add";
  saveBtn.onclick=()=>{
    const obj={};
    container.querySelectorAll("input").forEach(i=>{
      obj[i.dataset.col]=i.value;
    });

    if(row){
      const idx=data.indexOf(row);
      if(idx>-1) data[idx]=obj;
    } else {
      data.push(obj);
    }

    saveData(key,data);
    container.remove();
    loadDataset(slug);
  };
  container.appendChild(saveBtn);

  if(row){
    const del=document.createElement("button");
    del.className="btn btn-ghost";
    del.textContent="Delete";
    del.style.marginLeft="10px";
    del.onclick=()=>{
      const idx=data.indexOf(row);
      if(idx>-1) data.splice(idx,1);
      saveData(key,data);
      container.remove();
      loadDataset(slug);
    };
    container.appendChild(del);
  }

  document.body.insertBefore(container, document.body.firstChild);
}

async function init(){
  const dsRes = await fetch("datasets.json",{cache:"no-store"});
  state.datasets = await dsRes.json();

  state.datasets.forEach(d=>{
    const b=document.createElement("button");
    b.className="tab";
    b.textContent=d.name;
    b.onclick=()=>loadDataset(d.slug);
    $("tabs").appendChild(b);
  });

  const addBtn=document.createElement("button");
  addBtn.className="btn";
  addBtn.textContent="Add Row";
  addBtn.onclick=()=>openFormEditor(null);
  document.querySelector(".actions").appendChild(addBtn);

  await loadDataset(state.datasets[0].slug);
}

init();
