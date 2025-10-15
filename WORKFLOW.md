# 🚀 Flujo de trabajo profesional para commits y pushes

1. **Haz tus cambios en el código.**

2. **Agrega y commitea tus cambios:**

   ```bash
   git add .
   git commit -m "feat: descripción breve del cambio"
   ```

3. **Actualiza la versión del proyecto:**

   - Usa el comando adecuado según el tipo de cambio:
     - Para correcciones menores:  
       `npm version patch`
     - Para nuevas funcionalidades:  
       `npm version minor`
     - Para cambios incompatibles:  
       `npm version major`
   - Esto actualizará `package.json`, creará un commit y un tag de versión.

4. **Haz push al repositorio incluyendo los tags:**

   ```bash
   git push --follow-tags
   ```

   - El hook de Husky verificará que la versión fue actualizada antes de permitir el push.

5. **(Opcional) Crea el release en GitHub usando el tag creado automáticamente.**

6. **Para seguir trabajando, actualiza tu rama local:**

   ```bash
   git pull
   ```

---

## 💡 Notas importantes

- **No podrás hacer push si no actualizas la versión en `package.json`** (gracias al hook de Husky).
- Usar `npm version` mantiene el versionado y los tags sincronizados con tus cambios.
- Los tags son útiles para releases y changelogs en GitHub.

---

**¡Así mantienes un flujo profesional y controlado en tu proyecto!**
