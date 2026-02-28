// backend/scripts/print-moderation-permissions.js
import MODERATION_PERMISSION_MAP from '../config/moderation-permissions-map.js';

console.log('Moderation route → permissions:\n');
for (const [route, perms] of Object.entries(MODERATION_PERMISSION_MAP)) {
  console.log(`${route} -> ${perms.join(', ')}`);
}
