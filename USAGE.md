# Uso del Bot y Comandos

Esta guía explica cómo usar Apex Legends Rank Bot una vez instalado y configurado.

## 🟢 Comandos Disponibles

| Comando / Acción   | Descripción                                                                                                                                                                                                         | Permisos      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `/setup-roles`     | Configura el panel de selección de rango y mensaje de estadísticas con menú interactivo. **3 modos disponibles:** Automático (nombres predeterminados), Manual (nombres personalizados), Canales Existentes | Administrador |
| `/apex-status`     | Muestra el estado de Apex (mapas, Predator RP)                                                                                                                                                                      | Todos         |
| `/total-jugadores` | Muestra el número total de jugadores con rango                                                                                                                                                                      | Todos         |
| `/cleanup-data`    | [ADMIN] Limpia archivos JSON de servidores obsoletos                                                                                                                                                                | Owner del Bot |

> **Nota:** Los comandos `/setup-roles` y `/apex-status` son independientes y pueden configurarse en canales distintos. El comando de contexto aparece al hacer click derecho sobre un usuario.

## 🎛️ **Menú Interactivo de Configuración**

El comando `/setup-roles` inicia un proceso interactivo inteligente que se adapta automáticamente a tu servidor:

### � **Verificación Automática de Roles**

Al ejecutar `/setup-roles`, el bot verifica automáticamente si existen los roles necesarios para los rangos de Apex Legends:

- **Roles de rango**: Bronce, Plata, Oro, Platino, Diamante, Maestro, Apex Predator
- **Roles de plataforma**: PC, PlayStation, Xbox, Nintendo Switch

### 🛠️ **Creación de Roles Faltantes**

Si faltan roles, el bot ofrece opciones inteligentes:

- **Creación automática**: Si el bot tiene permisos, crea todos los roles faltantes con colores y configuración óptima
- **Instrucciones manuales**: Si el bot no puede crear roles, proporciona instrucciones detalladas para crearlos manualmente

### 🎯 **Selección de Modo de Configuración**

Después de verificar/crear los roles, el bot presenta un menú interactivo con tres opciones principales:

### 🔄 **Modo Automático**

- Crea automáticamente los canales con nombres predeterminados
- Canales: `#apex-range-admin` (control) y `#apex-rangos` (panel público)
- Proceso de un solo clic con confirmación visual
- Ideal para configuración rápida y servidores nuevos

### ⚙️ **Modo Manual Interactivo**

- Abre un formulario modal para personalizar nombres de canales
- Validación inteligente en tiempo real:
  - Solo letras minúsculas, números y guiones bajos
  - Longitud entre 3-32 caracteres
  - Nombres únicos en el servidor
  - Nombres diferentes para canales admin y panel
- Confirmación detallada antes de crear canales
- Experiencia guiada paso a paso con feedback visual

### 📎 **Modo Canales Existentes**

- Utiliza canales ya creados en tu servidor
- Selección visual de canales existentes mediante menús desplegables
- No crea nuevos canales, solo configura los existentes
- Perfecto para servidores con estructura establecida

### 🚀 **Flujo de Configuración Completo**

1. **Ejecución**: Usuario ejecuta `/setup-roles`
2. **Verificación**: Bot verifica roles automáticamente
3. **Creación**: Si faltan roles, ofrece creación automática o instrucciones
4. **Selección**: Muestra menú con 3 botones para elegir modo
5. **Interacción**: Modal o selección según el modo elegido
6. **Validación**: Verificación automática de permisos y configuración
7. **Confirmación**: Vista previa de lo que se creará/configurará
8. **Ejecución**: Creación automática de canales y configuración completa
9. **Resultado**: Embed detallado con enlaces a canales y estadísticas

### 🔧 **Características Inteligentes**

- **Detección automática de roles faltantes** con sugerencias de mapeo
- **Validación de permisos** con mensajes específicos sobre qué falta
- **Prevención de conflictos** de nombres de canales
- **Recuperación automática** de configuración previa si existe
- **Feedback visual** en cada paso del proceso

## Menú Contextual

- `Ver mi rango en Apex Range` (contexto) | Muestra tu rango actual y opciones de gestión | Todos |

## Menú Contextual

- `Ver mi rango en Apex Range` (contexto) | Muestra tu rango actual y opciones de gestión | Todos |

## 🎛️ Panel Interactivo

- **Botones para seleccionar rango**: Elige tu rango y el bot te asigna el rol correspondiente.
- **Gestión de rango**: Cambia o elimina tu rango fácilmente.
- **Estadísticas en tiempo real**: Ve cuántos jugadores hay por rango y quiénes están online.
- **Cards visuales**: Avatares de los últimos registrados y listados por rango.

## 🌐 Uso en Múltiples Canales

Una de las características más poderosas del bot es su capacidad para funcionar en diferentes canales de forma simultánea e independiente.

- **Panel de Roles y Estadísticas (`/setup-roles`)**: Puedes ejecutar este comando en un canal principal o de bienvenida (ej: `#bienvenida-y-roles`). El bot recordará este canal y mantendrá el panel de rangos y las estadísticas de jugadores siempre actualizado allí.

- **Panel de Estado de Apex (`/apex-status`)**: Este comando puedes ejecutarlo en un canal completamente diferente (ej: `#noticias-apex`). El bot mostrará y actualizará la rotación de mapas y el RP de Predator en ese canal, sin interferir con el panel de roles.

Esta separación te permite organizar tu servidor de manera más eficiente, manteniendo la información relevante en los canales adecuados.

### Rol común "Apex"

Además de los roles de rango, debes crear manualmente un **rol llamado `Apex`** en tu servidor.  
Este rol se asignará automáticamente a cualquier usuario que tenga un rango de Apex, y se removerá si el usuario ya no tiene ningún rango.

Puedes usar este rol para mencionar a todos los jugadores registrados fácilmente:

```
@Apex ¡Hay evento nuevo!
```

## Comando `/api-status`

Consulta el estado de la API externa utilizada por el bot.  
Muestra si la API está conectada y la última vez que se verificó.

## Comando de Contexto: Ver mi rango en Apex Range

Permite consultar el rango de cualquier usuario (incluyéndote a ti mismo) desde el menú contextual:

1. Haz click derecho sobre el nombre de usuario (en la lista de miembros o en el chat).
2. Selecciona **"Ver mi rango en Apex Range"** en la sección de Apps.

### Funcionamiento

- **Si eres tú mismo:**

  - El embed muestra tu rango actual con color, emoji y botones para gestionarlo o cerrarlo.
  - Si no tienes rango, puedes seleccionarlo directamente.

- **Si es otro usuario:**

  - El embed muestra el rango actual del usuario con color y emoji, y solo el botón "Cerrar".
  - Si el usuario no tiene rango, lo indica claramente.

- El mensaje es privado (ephemeral) y solo visible para quien ejecuta el comando.

## 🆕 Panel de Estado de Apex Legends y Perfil Interactivo

### Card de Estado de la API Mozambique

El bot incluye un **embed dinámico** que muestra información en tiempo real de la API oficial de Mozambique:

- **Rotación de mapas**: Battle Royale, Ranked y LTM, siempre actualizados
- **RP necesario para Predator**: Visualización clara para PC, PS4 y Xbox
- **Actualización automática**: El panel se refresca cada 5 minutos
- **Fuente y timestamp**: Siempre sabrás de dónde provienen los datos y cuándo se actualizaron

### Botón "Ver perfil Apex Global"

Debajo del embed de estado, encontrarás el botón:

```
[ Ver perfil Apex Global ]
```

- Al pulsarlo, se abre un modal donde puedes ingresar tu plataforma y usuario
- El bot consulta la API de Mozambique y te envía un **card privado** con tus estadísticas principales
- El embed utiliza colores y emojis personalizados según tu rango
- Si ocurre un error, recibirás un mensaje claro y profesional

#### Experiencia de usuario

- **Acceso rápido**: Todo desde el canal principal, sin comandos complicados
- **Privacidad**: Tu perfil se muestra solo a ti mediante mensaje ephemeral
- **Integración total**: El botón y el embed están siempre visibles y actualizados
- Al consultar tu perfil, verás **hasta tres embeds**:
  - El embed principal con tus estadísticas globales
  - El embed de Arenas con tu rango y datos de ese modo
  - El embed de Realtime con tu estado actual en el juego (si está disponible)

#### Detalles técnicos

- El panel y el botón se generan automáticamente al ejecutar `/setup-roles`.
- El estado de la API se obtiene usando la [API de Mozambique](https://apexlegendsapi.com/).
- El botón utiliza componentes interactivos de Discord para una experiencia moderna y fluida.
- El código es modular y fácil de mantener.

## 🌎 Visualización de países con banderas

Cuando un usuario tiene roles de país (por ejemplo, `ARGENTINA`, `MEXICO`, `VENEZUELA`), el bot mostrará automáticamente la bandera correspondiente junto al nombre del país en los listados de jugadores online.  
El nombre del país aparecerá capitalizado y en _cursiva_ para mayor claridad y menor impacto visual.

Ejemplo de visualización:

```
• @usuario1 (🇦🇷 _Argentina_, 🇲🇽 _Mexico_)
• @usuario2 (_Embajador_)
• @usuario3 (_Venelzuela_)
```

- Si el rol coincide con un país conocido, se muestra la bandera y el nombre capitalizado.
- Si el rol no es un país conocido, se muestra solo el nombre capitalizado y en cursiva.
- Puedes ampliar la lista de países editando el archivo `src/utils/country-flag.ts` y agregando más entradas al objeto `COUNTRY_NAME_TO_ISO`.

> **Nota:** Los roles de país deben estar en mayúsculas y escritos exactamente igual que en Discord para que la bandera se muestre correctamente.

## 🆘 Ayuda y Mensaje de Estado

Cuando uses `/apex-status` o veas el panel de estado, ten en cuenta:

- Si ves `⚠️ Datos en cache temporalmente` en alguna card, significa que la API no respondió y se está mostrando la última información válida.
- **Panel de estado Apex**: Se actualiza automáticamente cada 5 minutos.
- **Roles y presencia**: Se actualizan cada 2 minutos para mantener la información al día.
- **Imágenes del embed**: Se refrescan cada 10 minutos para optimizar rendimiento.
- Los emojis de estado de servidor indican si cada región está operativa, lenta o caída.
