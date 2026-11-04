// The only place that talks to the iPhone shell; browsers keep their existing paths.
const bridge = () => window.webkit?.messageHandlers?.belts;
export const hasNativeBridge = () => !!bridge();

export function haptic(ms) {
  try {
    if (hasNativeBridge()) bridge().postMessage({ name: 'haptic', ms });
    else navigator.vibrate?.(ms);
  } catch { /* optional feedback */ }
}

export function download(name, text, type) {
  if (hasNativeBridge()) {
    bridge().postMessage({ name: 'shareFile', filename: name, text, type });
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function share(text) {
  if (hasNativeBridge()) bridge().postMessage({ name: 'shareText', text });
  else if (navigator.share) await navigator.share({ text });
  else { await navigator.clipboard.writeText(text); return 'copied'; }
}

// Only the on-toggle tap may ask iOS for permission; all other messages just reschedule.
export function reminder(settings, practisedToday, requestPermission = false) {
  if (hasNativeBridge()) bridge().postMessage({
    name: 'reminder', on: settings.reminderOn, time: settings.remindAt,
    practisedToday, requestPermission,
  });
}

export function onReminderStatus(callback) {
  if (hasNativeBridge()) window.addEventListener('belts-reminder-status', e => callback(e.detail));
}

export function onNativeOpen(callback) {
  if (hasNativeBridge()) window.addEventListener('belts-open', callback);
}
