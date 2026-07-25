const usuario = getUsuario();
let rutas = [];

cargarRutas();

async function cargarRutas() {
    try {
        const res = await fetch(API_GESTION + '/rutas');
        rutas = await res.json();
        renderTabla(rutas);
    } catch (e) {
        console.error('Error cargando rutas:', e);
    }
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-rutas');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">No hay rutas registradas</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(r => `
        <tr>
            <td>${r.nombre}</td>
            <td>${r.zona}</td>
            <td>
                <span style="display:inline-flex;align-items:center;gap:6px">
                    <span style="width:14px;height:14px;border-radius:50%;background:${r.color};display:inline-block;border:1px solid #ccc"></span>
                    ${r.color}
                </span>
            </td>
            <td>${r.contenedores ? r.contenedores.length : 0}</td>
            <td><span class="badge ${r.estado === 'activa' ? 'badge-active' : 'badge-inactive'}">${r.estado}</span></td>
            <td>
                <a class="action-link" onclick="editar(${r.id_ruta})">Editar</a>
                <a class="action-link delete" onclick="eliminar(${r.id_ruta})">Eliminar</a>
            </td>
        </tr>
    `).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const filtrado = rutas.filter(r =>
        r.nombre.toLowerCase().includes(q) ||
        r.zona.toLowerCase().includes(q) ||
        r.estado.toLowerCase().includes(q)
    );
    renderTabla(filtrado);
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar ruta';
    document.getElementById('form-ruta').reset();
    document.getElementById('color').value = '#1a5c52';
    document.getElementById('ruta-id').value = '';
    document.getElementById('modal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
}

function editar(id) {
    const r = rutas.find(x => x.id_ruta == id);
    if (!r) return;
    document.getElementById('modal-titulo').textContent = 'Editar ruta';
    document.getElementById('ruta-id').value = r.id_ruta;
    document.getElementById('nombre').value = r.nombre;
    document.getElementById('zona').value = r.zona;
    document.getElementById('descripcion').value = r.descripcion || '';
    document.getElementById('color').value = r.color || '#1a5c52';
    document.getElementById('estado').value = r.estado;
    document.getElementById('modal').classList.add('active');
}

async function eliminar(id) {
    if (!confirm('¿Eliminar esta ruta? Los contenedores asignados quedarán sin ruta.')) return;
    try {
        await fetch(`${API_GESTION}/rutas/${id}`, { method: 'DELETE' });
        cargarRutas();
    } catch (e) {
        alert('Error al eliminar');
    }
}

document.getElementById('form-ruta').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ruta-id').value;
    const body = {
        nombre:      document.getElementById('nombre').value,
        zona:        document.getElementById('zona').value,
        descripcion: document.getElementById('descripcion').value,
        color:       document.getElementById('color').value,
        estado:      document.getElementById('estado').value,
    };

    try {
        if (id) {
            await fetch(`${API_GESTION}/rutas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            await fetch(`${API_GESTION}/rutas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        cerrarModal();
        cargarRutas();
    } catch (e) {
        alert('Error al guardar');
    }
});
