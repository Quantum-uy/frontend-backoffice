const usuario = getUsuario();
setActivePage('maquinaria');

let maquinaria = [];
let centros = [];

async function cargarDatos() {
    const [resMaq, resCentros] = await Promise.all([
        fetch(API_GESTION + '/maquinaria'),
        fetch(API_GESTION + '/centros-acopio')
    ]);
    maquinaria = await resMaq.json();
    centros = await resCentros.json();

    const select = document.getElementById('id_centro');
    centros.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_centro;
        opt.textContent = c.nombre;
        select.appendChild(opt);
    });

    renderizar(maquinaria);
}

function renderizar(lista) {
    document.getElementById('tabla-maquinaria').innerHTML = lista.map(m => `
        <tr>
            <td>${m.id_maquinaria}</td>
            <td>${m.tipo}</td>
            <td><span class="badge ${getBadgeClass(m.estado)}">${m.estado}</span></td>
            <td>${m.centro_nombre || '-'}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 10px" onclick="editar(${m.id_maquinaria})">Editar</button>
                <button class="btn btn-danger"  style="padding:4px 10px" onclick="eliminar(${m.id_maquinaria})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    renderizar(maquinaria.filter(m =>
        m.tipo.toLowerCase().includes(q) ||
        m.estado.toLowerCase().includes(q)
    ));
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar maquinaria';
    document.getElementById('form-maquinaria').reset();
    document.getElementById('maq-id').value = '';
    document.getElementById('modal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

function editar(id) {
    const m = maquinaria.find(x => x.id_maquinaria == id);
    document.getElementById('modal-titulo').textContent = 'Editar maquinaria';
    document.getElementById('maq-id').value   = m.id_maquinaria;
    document.getElementById('tipo').value     = m.tipo;
    document.getElementById('estado').value   = m.estado;
    document.getElementById('id_centro').value = m.id_centro || '';
    document.getElementById('modal').style.display = 'flex';
}

async function eliminar(id) {
    if (!confirm('¿Eliminar esta maquinaria?')) return;
    const res = await fetch(API_GESTION + '/maquinaria/' + id, { method: 'DELETE' });
    if (res.ok) cargarDatos();
    else alert('No se pudo eliminar');
}

document.getElementById('form-maquinaria').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('maq-id').value;
    const data = {
        tipo:      document.getElementById('tipo').value,
        estado:    document.getElementById('estado').value,
        id_centro: document.getElementById('id_centro').value || null
    };
    const url    = API_GESTION + '/maquinaria' + (id ? '/' + id : '');
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) { cerrarModal(); cargarDatos(); }
    else alert('Error al guardar');
});

cargarDatos();
