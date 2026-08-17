const usuario = getUsuario();
setActivePage('centros-acopio');

let centros = [];

async function cargarCentros() {
    const res = await fetch(API_GESTION + '/centros-acopio');
    centros = await res.json();
    renderizar(centros);
}

function renderizar(lista) {
    document.getElementById('tabla-centros').innerHTML = lista.map(c => `
        <tr>
            <td>${c.id_centro}</td>
            <td>${c.nombre}</td>
            <td>${c.ubicacion || '-'}</td>
            <td>${c.capacidad ? c.capacidad + ' ton' : '-'}</td>
            <td>
                <button class="btn btn-outline" style="padding:4px 10px" onclick="editar(${c.id_centro})">Editar</button>
                <button class="btn btn-danger"  style="padding:4px 10px" onclick="eliminar(${c.id_centro})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    renderizar(centros.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.ubicacion || '').toLowerCase().includes(q)
    ));
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar centro de acopio';
    document.getElementById('form-centro').reset();
    document.getElementById('centro-id').value = '';
    document.getElementById('modal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

function editar(id) {
    const c = centros.find(x => x.id_centro == id);
    document.getElementById('modal-titulo').textContent = 'Editar centro de acopio';
    document.getElementById('centro-id').value  = c.id_centro;
    document.getElementById('nombre').value     = c.nombre;
    document.getElementById('ubicacion').value  = c.ubicacion || '';
    document.getElementById('capacidad').value  = c.capacidad || '';
    document.getElementById('modal').style.display = 'flex';
}

async function eliminar(id) {
    if (!confirm('¿Eliminar este centro de acopio?')) return;
    const res = await fetch(API_GESTION + '/centros-acopio/' + id, { method: 'DELETE' });
    if (res.ok) cargarCentros();
    else alert('No se pudo eliminar');
}

document.getElementById('form-centro').addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('centro-id').value;
    const data = {
        nombre:    document.getElementById('nombre').value,
        ubicacion: document.getElementById('ubicacion').value,
        capacidad: document.getElementById('capacidad').value || null
    };
    const url    = API_GESTION + '/centros-acopio' + (id ? '/' + id : '');
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) { cerrarModal(); cargarCentros(); }
    else alert('Error al guardar');
});

cargarCentros();
