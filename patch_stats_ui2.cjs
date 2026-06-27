const fs = require('fs');

let content = fs.readFileSync('src/render/stats_ui.ts', 'utf8');

// Modify imports
content = content.replace(
    /import { type Entity, type GameState, ItemType } from '\.\.\/core\/types';/,
    'import { type Entity, type GameState, ItemType, DamageType } from \'../core/types\';'
);


// 1. Draw ARMOR slot
// We can draw it right next to the grid, or below it, as requested: "Слот брони — большой квадрат 2x размера обычного слота, под основной сеткой или справа."

content = content.replace(
    '// ── RIGHT COLUMN: stats ──────────────────────────────────',
    `// ── ARMOR SLOT ───────────────────────────────────────────
  const armorSz = cellSz * 2;
  const armorX = gridX + gridCols * cellSz + 8 * sx;
  const armorY = gridY;

  ctx.fillStyle = 'rgba(5,15,20,0.8)';
  ctx.fillRect(armorX, armorY, armorSz - 2, armorSz - 2);
  ctx.strokeStyle = 'rgba(0,100,80,0.25)';
  ctx.strokeRect(armorX, armorY, armorSz - 2, armorSz - 2);

  ctx.fillStyle = '#555';
  ctx.font = \`\${4.2 * sy}px monospace\`;
  ctx.textAlign = 'center';
  ctx.fillText('БРОНЯ', armorX + armorSz / 2, armorY + armorSz / 2);
  ctx.textAlign = 'left';

  if (player.armor) {
    const armorDef = ITEMS[player.armor];
    if (armorDef) {
       drawItemGridIcon(ctx, player.armor, armorDef.name, armorX, armorY, armorSz, sx, sy, false, 1);
    }
  }

  // ── RIGHT COLUMN: stats ──────────────────────────────────`
);

// 2. Add damage type and resistances logic on hover
// Hover logic doesn't exist, it uses `invSel`.
content = content.replace(
    /ctx\.fillText\(fitStatText\(ctx, \`Цена: \$\{def\.value \?\? 0\}₽\`, details\.w\), details\.x, infoY \+ 1\.4 \* ts\);/,
    `ctx.fillText(fitStatText(ctx, \`Цена: \${def.value ?? 0}₽\`, details.w), details.x, infoY + 1.4 * ts);

      let dmgTypeY = infoY + 1.4 * ts + 5.8 * ts;
      if (def.type === ItemType.WEAPON && def.damageType) {
        ctx.fillStyle = '#f84';
        let dmgTypeStr = def.damageType;
        if (def.damageType === DamageType.FIRE) { dmgTypeStr = '🔴 Огонь'; ctx.fillStyle = '#f44'; }
        if (def.damageType === DamageType.ENERGY) { dmgTypeStr = '🔵 Энерго'; ctx.fillStyle = '#44f'; }
        if (def.damageType === DamageType.PSI) { dmgTypeStr = '🟣 Пси'; ctx.fillStyle = '#a4f'; }
        if (def.damageType === DamageType.KINETIC) { dmgTypeStr = '⚫ Кинетика'; ctx.fillStyle = '#444'; }
        if (def.damageType === DamageType.SHOT) { dmgTypeStr = '🟡 Дробь'; ctx.fillStyle = '#ee4'; }

        ctx.fillText(fitStatText(ctx, \`Урон: \${dmgTypeStr}\`, details.w), details.x, dmgTypeY);
        dmgTypeY += 5.8 * ts;
      }

      if (def.type === ItemType.ARMOR && def.resistances) {
        ctx.fillStyle = '#8cf';
        ctx.fillText('Сопротивления:', details.x, dmgTypeY);
        dmgTypeY += 5.8 * ts;

        const resList = Object.entries(def.resistances);
        let resStr = '';
        for (const [resType, val] of resList) {
          let rIcon = resType;
          if (resType === DamageType.FIRE) { rIcon = '🔴'; }
          if (resType === DamageType.ENERGY) { rIcon = '🔵'; }
          if (resType === DamageType.PSI) { rIcon = '🟣'; }
          if (resType === DamageType.KINETIC) { rIcon = '⚫'; }
          if (resType === DamageType.SHOT) { rIcon = '🟡'; }
          resStr += \`\${rIcon} \${val}%  \`;
        }
        ctx.fillText(fitStatText(ctx, resStr, details.w), details.x, dmgTypeY);
      }
      `
);

// We should update equipment lines for Armor
content = content.replace(
    /const lines: EquipmentLine\[\] = \[/,
    `const armorName = player.armor ? (ITEMS[player.armor]?.name ?? player.armor) : 'нет';
  const lines: EquipmentLine[] = [
    { text: \`Оружие: \${weapon.name}\`, color: '#ccc' },
    { text: \`\${weapon.role}  ур.\${weapon.damageLabel}  \${weaponState}\`, color: weapon.warning ? '#f84' : '#9d9' },
    { text: \`Инструмент: \${toolName}\`, color: '#8cf' },
    { text: \`износ \${toolDurLabel}\`, color: '#8cf' },
    { text: \`Броня: \${armorName}\`, color: '#ccc' },
  ];
  // Replace definition array directly:`
);
content = content.replace(
  `const lines: EquipmentLine[] = [
    { text: \`Оружие: \${weapon.name}\`, color: '#ccc' },
    { text: \`\${weapon.role}  ур.\${weapon.damageLabel}  \${weaponState}\`, color: weapon.warning ? '#f84' : '#9d9' },
    { text: \`Инструмент: \${toolName}\`, color: '#8cf' },
    { text: \`износ \${toolDurLabel}\`, color: '#8cf' },
  ];`,
  ``
);

fs.writeFileSync('src/render/stats_ui.ts', content);
