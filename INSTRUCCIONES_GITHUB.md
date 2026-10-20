# Cómo publicar la exposición en GitHub

## 1. Preparación

Descomprime el ZIP y sube **los archivos contenidos**, no el ZIP como archivo único. Este paquete expone diagramas y extractos de código, pero no el código completo.

## 2. Crear repositorio

1. Ve a https://github.com/new.
2. Nombre sugerido: `ceramicdent-e2e`.
3. Elige **Public** para permitir que el docente entre con el enlace, o **Private** para invitar usuarios específicos (GitHub personal no ofrece una modalidad estrictamente solo-lectura a colaboradores privados).
4. No marques "Add a README" porque el paquete ya lo incluye.
5. Crea el repositorio.

## 3. Subir desde tu computadora

Abre Git Bash o una terminal dentro de la carpeta descomprimida:

```bash
git init
git add .
git commit -m "Exposición E2E de Ceramic Dent"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/ceramicdent-e2e.git
git push -u origin main
```

Reemplaza `TU-USUARIO` por tu usuario real; GitHub puede solicitar inicio de sesión. Si usas un nombre de repositorio diferente, adapta la URL.

## 4. Activar presentación web (opcional)

Repository → Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs` → Save.

El sitio normalmente quedará en `https://TU-USUARIO.github.io/ceramicdent-e2e/` una vez publicada la página.

## 5. Compartir con el docente

Pasa la dirección del repositorio y el enlace al sitio de presentación. Cada tabla del README enlaza a su diagrama y guía técnica.

## Advertencias importantes

- GitHub **no permite mostrar un repositorio y prohibir técnicamente su descarga/clonado**.
- Esta versión **no incluye todo el código**. Si el docente exige todo el código fuente del MVP, publica la edición privada por separado y ofrece el acceso correspondiente.
- Nunca subas `.env`, contraseñas, tokens de Decolecta, SMTP, Keycloak ni respaldos con nombres o DNI de pacientes.
- GitHub Pages suele ser público incluso al originarse de un repositorio privado: no lo utilices para materiales secretos.
