<div align="center">
  <h1>🎓 AI English Tutor</h1>
  <p><em>Practica tu inglés con un tutor de IA con conversaciones en tiempo real y flashcards inteligentes</em></p>
</div>

# Tutor de Inglés con IA

Una aplicación web interactiva para practicar inglés mediante conversaciones en tiempo real con IA, sistema de flashcards con repetición espaciada, y seguimiento del progreso del usuario.

## ✨ Características

- 🗣️ **Conversaciones en tiempo real** con voz a voz usando Google Gemini Live API
- 🎴 **Sistema de flashcards** con algoritmo SM2 de repetición espaciada
- 🔊 **Síntesis de voz** para pronunciación correcta del vocabulario
- 📝 **Selección de texto** con traducciones instantáneas
- 👤 **Autenticación de usuarios** y gestión de sesiones
- 📊 **Historial de conversaciones** y seguimiento de progreso
- 🎨 **Interfaz responsive** diseñada con Tailwind CSS

## 🛠️ Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **IA**: Google Gemini API (conversaciones y texto a voz)
- **Backend**: Supabase (autenticación y base de datos)
- **Estilos**: Tailwind CSS
- **Audio**: WebRTC y Web Audio API

## 🚀 Empezar

### Prerrequisitos

- Node.js (v18 o superior)
- npm o yarn
- Clave de API de Google Gemini
- Proyecto de Supabase

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_GEMINI_API_KEY=tu_clave_de_gemini_aqui
VITE_SUPABASE_URL=tu_url_de_supabase_aqui
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase_aqui
```

**Para obtener las claves:**

1. **Google Gemini API**:
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva clave API

2. **Supabase**:
   - Crea un nuevo proyecto en [supabase.com](https://supabase.com)
   - Copia la URL del proyecto y la clave anónima desde la configuración

### 3. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
├── components/          # Componentes React
│   ├── Auth.tsx        # Autenticación de usuarios
│   ├── ConversationView.tsx  # Vista de conversación
│   ├── FlashcardsPanel.tsx   # Panel de flashcards
│   └── HistoryPanel.tsx      # Historial de conversaciones
├── hooks/              # Hooks personalizados
│   ├── useConversation.ts    # Gestión de conversaciones
│   ├── useSupabaseData.ts    # Integración con Supabase
│   ├── useTextSelection.ts   # Selección de texto
│   └── useTextToSpeech.ts    # Síntesis de voz
├── utils/              # Utilidades
│   ├── audioUtils.ts   # Procesamiento de audio
│   └── sm2Algorithm.ts # Algoritmo de repetición espaciada
├── types.ts            # Definiciones de tipos TypeScript
├── constants.ts        # Personas y escenarios predefinidos
└── supabaseClient.ts   # Cliente de Supabase
```

## 🎮 Cómo Usar

### 1. Iniciar Sesión
- Ingresa tu correo electrónico para recibir un enlace mágico de acceso

### 2. Conversación
- Selecciona una persona (tutor) y un escenario
- Haz clic en el botón de micrófono para comenzar una conversación de voz
- El tutor de IA responderá en tiempo real

### 3. Flashcards
- Durante las conversaciones, puedes seleccionar texto para crear flashcards
- Las flashcards usan repetición espaciada para optimizar el aprendizaje
- Haz clic en el ícono de sonido para escuchar la pronunciación

### 4. Seguimiento
- Revisa tu historial de conversaciones
- Monitorea tu progreso con las flashcards

## 🎯 Personas y Escenarios

La aplicación incluye varias personas predefinidas:
- **Profesor formal**: Para aprendizaje estructurado
- **Amigo conversacional**: Para práctica casual
- **Coach de negocios**: Para inglés profesional
- **Compañero de viajes**: Para vocabulario de viaje

Y diversos escenarios:
- Restaurante
- Aeropuerto
- Entrevista de trabajo
- Consultorio médico
- Y muchos más...

## 🔧 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crear una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit de los cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias:
- Abre un issue en GitHub
- Revisa la documentación en `CLAUDE.md` para más detalles técnicos

---

**View your app in AI Studio**: https://ai.studio/apps/drive/173RNPXP6cM9n2wGr_slv8IPcVzjlTmGY
