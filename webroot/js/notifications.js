class Notifications {
  constructor() {
    this.id = 1;
  }

  requestPermission() {
    if (!cordova) return;
    cordova.plugins.notification.local.requestPermission();
  }

  clearAll() {
    if (!cordova) return;
    cordova.plugins.notification.local.clearAll();
  }

  triggerTaskReminder(task) {
    if (!cordova) return;

    if (task.done || !task.reminder || task.reminder === "") {
      return;
    }

    const triggerDate = new Date(task.reminder);
    cordova.plugins.notification.local.schedule({
      id: this.id++,
      title: "Erinnerung",
      text: task.task + " sollte erledigt werden.",
      trigger: { at: triggerDate },
    });
  }
}
