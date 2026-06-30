import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const notificationService = {
  // Verificar si estamos en un dispositivo nativo
  isNative: () => Capacitor.isNativePlatform(),

  // Solicitar permisos
  async requestPermissions() {
    if (!this.isNative()) return false;
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  },

  // Programar recordatorio diario
  async scheduleDailyReminder(hour = 20, minute = 0) {
    if (!this.isNative()) return;
    
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Cancelar recordatorios anteriores
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // Recordatorio de la noche (default 8pm)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: '💰 GastosApp - Recordatorio',
          body: '¿Ya registraste tus gastos e ingresos de hoy? ¡No olvides llevar el control!',
          schedule: {
            on: { hour, minute },
            repeats: true,
            allowWhileIdle: true
          },
          sound: 'default',
          actionTypeId: 'OPEN_APP',
          extra: { route: '/transactions' }
        }
      ]
    });
  },

  // Cancelar todos los recordatorios
  async cancelAll() {
    if (!this.isNative()) return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  },

  // Verificar si hay recordatorios programados
  async hasPendingReminders() {
    if (!this.isNative()) return false;
    const pending = await LocalNotifications.getPending();
    return pending.notifications.length > 0;
  }
};
