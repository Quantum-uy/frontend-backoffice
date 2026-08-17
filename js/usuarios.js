const usuario = getUsuario();
let usuarios = [];

cargarUsuarios();

async function cargarUsuarios() {
    try {
        const res = await fetch(API_USUARIOS + '/usuarios');
        usuarios = await res.json();
        renderTabla(usuarios);
    } catch (e) {
        console.error('Error cargando usuarios:', e);
    }
}

function renderTabla(data) {
    const tbody = document.getElementById('tabla-usuarios');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">No hay usuarios registrados</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(u => {
        const badgeEstado = u.estado === 'activo' ? 'badge-success'
            : u.estado === 'pendiente' ? 'badge-warning'
            : 'badge-danger';

        let acciones = `<a class="action-link" onclick="editar(${u.id_usuario})">Editar</a>`;

        if (u.estado === 'pendiente') {
            acciones += ` <a class="action-link" onclick="cambiarEstado(${u.id_usuario}, 'activo')">Aprobar</a>`;
            acciones += ` <a class="action-link delete" onclick="cambiarEstado(${u.id_usuario}, 'inactivo')">Rechazar</a>`;
        } else if (u.estado === 'activo') {
            acciones += ` <a class="action-link delete" onclick="cambiarEstado(${u.id_usuario}, 'inactivo')">Desactivar</a>`;
        } else {
            acciones += ` <a class="action-link" onclick="cambiarEstado(${u.id_usuario}, 'activo')">Activar</a>`;
        }
        acciones += ` <a class="action-link delete" onclick="eliminar(${u.id_usuario})">Eliminar</a>`;

        return `
        <tr>
            <td>${u.nombre} ${u.apellido || ''}</td>
            <td>${u.email}</td>
            <td><span class="badge badge-info">${u.rol || 'sin rol'}</span></td>
            <td><span class="badge ${badgeEstado}">${u.estado}</span></td>
            <td>${acciones}</td>
        </tr>`;
    }).join('');
}

function filtrar() {
    const q = document.getElementById('buscar').value.toLowerCase();
    const filtrado = usuarios.filter(u =>
        (u.nombre || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.rol || '').toLowerCase().includes(q)
    );
    renderTabla(filtrado);
}

function abrirModal() {
    document.getElementById('modal-titulo').textContent = 'Agregar usuario';
    document.getElementById('form-usuario').reset();
    document.getElementById('usuario-id').value = '';
    document.getElementById('contrasena').required = true;
    document.getElementById('modal').classList.add('active');
}

function cerrarModal() {
    document.getElementById('modal').classList.remove('active');
}

async function cambiarEstado(id, estado) {
    const accion = estado === 'activo' ? 'aprobar' : 'desactivar';
    if (!confirm(`¿Seguro que querés ${accion} este usuario?`)) return;
    try {
        await fetch(`${API_USUARIOS}/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        cargarUsuarios();
    } catch (e) {
        alert('Error al cambiar estado');
    }
}

async function editar(id) {
    const u = usuarios.find(x => x.id_usuario == id);
    document.getElementById('modal-titulo').textContent = 'Editar usuario';
    document.getElementById('usuario-id').value  = u.id_usuario;
    document.getElementById('nombre').value      = u.nombre;
    document.getElementById('apellido').value    = u.apellido || '';
    document.getElementById('email').value       = u.email;
    document.getElementById('contrasena').value  = '';
    document.getElementById('rol').value         = u.rol;
    document.getElementById('contrasena').required = false;
    document.getElementById('modal').classList.add('active');
}

async function eliminar(id) {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    const res = await fetch(`${API_USUARIOS}/usuarios/${id}`, { method: 'DELETE' });
    if (res.ok) cargarUsuarios();
    else alert('No se pudo eliminar el usuario');
}

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuario-id').value;

    const body = {
        nombre:    document.getElementById('nombre').value,
        apellido:  document.getElementById('apellido').value,
        email:     document.getElementById('email').value,
        rol:       document.getElementById('rol').value
    };
    if (!id) body.contrasena = document.getElementById('contrasena').value;

    const url    = id ? `${API_USUARIOS}/usuarios/${id}` : `${API_USUARIOS}/usuarios`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error || 'Error al guardar'); return; }
        cerrarModal();
        cargarUsuarios();
    } catch (e) {
        alert('Error al conectar con el servidor');
    }
});
