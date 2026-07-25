const usuario = getUsuario();
let camiones = [];

cargarCamiones();

async function cargarCamiones() {
    try {
        const res = await fetch(API_CAMIONES + '/camiones');
        camiones = await res.json();
        renderTabla(camiones);
    } catch (e) {
        console.error('Error cargando camiones:', e);
    }
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-camiones');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">No hay camiones registrados</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(c => `
        <tr>
            <td>${c.matricula}</td>
            <td>${c.modelo}</td>
            <td><span class="badge ${getBadgeClass(c.estado)}">${c.estado}</span></td>
            <td>${c.tipo_residuo_nombre || '-'}</td>
            <td>
                <a class="action-link" onclick="editar(${c.id_camion})">Editar</a>
                <a class="action-link delete" onclick="eliminar(${c.id_camion})">Eliminar</a>
            </td>
        </tr>
    `).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const filtrado = camiones.filter(c =>
        c.matricula.toLowerCase().includes(q) ||
        c.modelo.toLowerCase().includes(q) ||
        c.estado.toLowerCase().includes(q)
    );
    renderTabla(filtrado);
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar camión';
    document.getElementById('form-camion').reset();
    document.getElementById('camion-id').value = '';
    document.getElementById('modal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
}

function editar(id) {
    const c = camiones.find(x => x.id_camion == id);
    if (!c) return;
    document.getElementById('modal-titulo').textContent = 'Editar camión';
    document.getElementById('camion-id').value = c.id_camion;
    document.getElementById('matricula').value = c.matricula;
    document.getElementById('modelo').value = c.modelo;
    document.getElementById('estado').value = c.estado;
    document.getElementById('id_tipo_residuo').value = c.id_tipo_residuo || 1;
    document.getElementById('modal').classList.add('active');
}

async function eliminar(id) {
    if (!confirm('¿Eliminar este camión?')) return;
    try {
        await fetch(`${API_CAMIONES}/camiones/${id}`, { method: 'DELETE' });
        cargarCamiones();
    } catch (e) {
        alert('Error al eliminar');
    }
}

document.getElementById('form-camion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('camion-id').value;
    const body = {
        matricula: document.getElementById('matricula').value,
        modelo: document.getElementById('modelo').value,
        estado: document.getElementById('estado').value,
        id_tipo_residuo: parseInt(document.getElementById('id_tipo_residuo').value)
    };

    try {
        if (id) {
            await fetch(`${API_CAMIONES}/camiones/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } else {
            await fetch(`${API_CAMIONES}/camiones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        }
        cerrarModal();
        cargarCamiones();
    } catch (e) {
        alert('Error al guardar');
    }
});
