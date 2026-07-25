const API_USUARIOS = 'http://localhost/sigeru/api-usuarios';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-msg');

    errorDiv.style.display = 'none';

    try {
        const res = await fetch(`${API_USUARIOS}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, contrasena: password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorDiv.textContent = data.error || 'Error al iniciar sesión';
            errorDiv.style.display = 'block';
            return;
        }

        sessionStorage.setItem('usuario', JSON.stringify(data));
        window.location.href = 'index.html';
    } catch (err) {
        errorDiv.textContent = 'No se pudo conectar con el servidor';
        errorDiv.style.display = 'block';
    }
});

if (sessionStorage.getItem('usuario')) {
    window.location.href = 'index.html';
}
