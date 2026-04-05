'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Locale = 'es' | 'en';

const translations = {
  // Status labels
  'status.pending': { es: 'Pendiente', en: 'Pending' },
  'status.in_progress': { es: 'En Progreso', en: 'In Progress' },
  'status.review': { es: 'Revisión', en: 'Review' },
  'status.checked_in': { es: 'Registrado', en: 'Checked In' },
  'status.deployed': { es: 'Desplegado', en: 'Deployed' },
  'status.done': { es: 'Completado', en: 'Done' },

  // Task type labels
  'type.dev': { es: 'Desarrollo', en: 'Dev' },
  'type.design': { es: 'Diseño', en: 'Design' },
  'type.animation': { es: 'Animación', en: 'Animation' },
  'type.content': { es: 'Contenido', en: 'Content' },
  'type.deploy': { es: 'Despliegue', en: 'Deploy' },
  'type.report': { es: 'Reporte', en: 'Report' },
  'type.other': { es: 'Otro', en: 'Other' },

  // Assignee labels
  'assignee.angel': { es: 'Angel', en: 'Angel' },
  'assignee.cowork': { es: 'Cowork', en: 'Cowork' },
  'assignee.claude-code': { es: 'Claude Code', en: 'Claude Code' },

  // Priority labels
  'priority.1': { es: 'Crítica', en: 'Critical' },
  'priority.2': { es: 'Alta', en: 'High' },
  'priority.3': { es: 'Media', en: 'Medium' },
  'priority.4': { es: 'Baja', en: 'Low' },

  // UI strings
  'nav.back': { es: 'Volver a proyectos', en: 'Back to projects' },
  'nav.projects': { es: 'Proyectos', en: 'Projects' },
  'nav.subtitle': { es: 'Orquestación de tareas — 1000Problems', en: 'Task orchestration — 1000Problems' },

  'task.title': { es: 'Título', en: 'Title' },
  'task.type': { es: 'Tipo', en: 'Type' },
  'task.status': { es: 'Estado', en: 'Status' },
  'task.assignee': { es: 'Asignado', en: 'Assignee' },
  'task.updated': { es: 'Actualizado', en: 'Updated' },
  'task.priority': { es: 'Prioridad', en: 'Priority' },
  'task.description': { es: 'Descripción', en: 'Description' },
  'task.new': { es: 'Nueva tarea...', en: 'New task...' },
  'task.add': { es: 'Agregar', en: 'Add' },
  'task.addTask': { es: 'Agregar tarea', en: 'Add task' },
  'task.adding': { es: 'Agregando...', en: 'Adding...' },
  'task.delete': { es: 'Eliminar', en: 'Delete' },
  'task.deleting': { es: 'Eliminando...', en: 'Deleting...' },
  'task.close': { es: 'Cerrar', en: 'Close' },
  'task.details': { es: 'Detalles', en: 'Details' },
  'task.completed': { es: 'Completados', en: 'Completed' },
  'task.moveTo': { es: 'Mover a...', en: 'Move to...' },
  'task.descPlaceholder': { es: 'Clic para agregar descripción...', en: 'Click to add description...' },
  'task.created': { es: 'Creado', en: 'Created' },
  'task.started': { es: 'Iniciado', en: 'Started' },
  'task.deleteError': { es: 'Error al eliminar', en: 'Error deleting' },

  'video.title': { es: 'Solicitudes de Video', en: 'Video Requests' },
  'video.placeholder': { es: 'Describe un video...', en: 'Describe a video...' },
  'video.submit': { es: 'Enviar', en: 'Submit' },
  'video.queued': { es: 'En cola', en: 'Queued' },
  'video.processing': { es: 'Procesando...', en: 'Processing...' },
  'video.view': { es: 'Ver video', en: 'View video' },

  'loading': { es: 'Cargando...', en: 'Loading...' },
  'loading.projects': { es: 'Cargando proyectos...', en: 'Loading projects...' },
  'project.notFound': { es: 'Proyecto no encontrado', en: 'Project not found' },
  'project.pending': { es: 'pendiente', en: 'pending' },
  'project.pendingPlural': { es: 'pendientes', en: 'pending' },
  'project.inProgress': { es: 'en progreso', en: 'in progress' },
  'project.total': { es: 'total', en: 'total' },

  'auth.password': { es: 'Contraseña', en: 'Password' },
  'auth.login': { es: 'Iniciar sesión', en: 'Log in' },
  'auth.loggingIn': { es: 'Iniciando sesión...', en: 'Logging in...' },
  'auth.wrongPassword': { es: 'Contraseña incorrecta', en: 'Wrong password' },
  'auth.loginError': { es: 'Error al iniciar sesión', en: 'Login error' },
  'auth.networkError': { es: 'Error de red', en: 'Network error' },
} as const;

export type TranslationKey = keyof typeof translations;

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  t: (key) => translations[key]?.es || key,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    const stored = localStorage.getItem('vybepm-locale') as Locale | null;
    if (stored === 'en' || stored === 'es') {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('vybepm-locale', newLocale);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key]?.[locale] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
