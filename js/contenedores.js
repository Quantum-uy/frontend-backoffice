const usuario = getUsuario();
let contenedores = [];

cargarContenedores();

async function cargarContenedores() {
    try {
        const res = await fetch(API_GESTION + '/contenedores');
        contenedores = await res.json();
        renderTabla(contenedores);
    } catch (e) {
        console.error('Error cargando contenedores:', e);
    }
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-contenedores');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">No hay contenedores registrados</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${c.id_contenedor}</td>
            <td>${c.ubicacion}</td>
            <td>${c.zona}</td>
            <td><span class="badge ${getBadgeClass(c.estado)}">${c.estado}</span></td>
            <td>${c.tipo_residuo || '-'}</td>
            <td>
                <a class="action-link" onclick="editar(${c.id_contenedor})">Editar</a>
                <a class="action-link delete" onclick="eliminar(${c.id_contenedor})">Eliminar</a>
            </td>
        </tr>
    `).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const filtrado = contenedores.filter(c =>
        (c.ubicacion || '').toLowerCase().includes(q) ||
        (c.zona || '').toLowerCase().includes(q) ||
        (c.estado || '').toLowerCase().includes(q)
    );
    renderTabla(filtrado);
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar contenedor';
    document.getElementById('form-contenedor').reset();
    document.getElementById('contenedor-id').value = '';
    document.getElementById('modal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
}

function editar(id) {
    const c = contenedores.find(x => x.id_contenedor == id);
    if (!c) return;
    document.getElementById('modal-titulo').textContent = 'Editar contenedor';
    document.getElementById('contenedor-id').value = c.id_contenedor;
    document.getElementById('ubicacion').value = c.ubicacion;
    document.getElementById('zona').value = c.zona;
    document.getElementById('estado').value = c.estado;
    document.getElementById('tipo_residuo').value = c.tipo_residuo || '';
    document.getElementById('modal').classList.add('active');
}

async function eliminar(id) {
    if (!confirm('¿Eliminar este contenedor?')) return;
    try {
        await fetch(`${API_GESTION}/contenedores/${id}`, { method: 'DELETE' });
        cargarContenedores();
    } catch (e) {
        alert('Error al eliminar');
    }
}

document.getElementById('form-contenedor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('contenedor-id').value;
    const body = {
        ubicacion: document.getElementById('ubicacion').value,
        zona: document.getElementById('zona').value,
        estado: document.getElementById('estado').value,
        tipo_residuo: document.getElementById('tipo_residuo').value
    };

    try {
        if (id) {
            await fetch(`${API_GESTION}/contenedores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            await fetch(`${API_GESTION}/contenedores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        cerrarModal();
        cargarContenedores();
    } catch (e) {
        alert('Error al guardar');
    }
});
