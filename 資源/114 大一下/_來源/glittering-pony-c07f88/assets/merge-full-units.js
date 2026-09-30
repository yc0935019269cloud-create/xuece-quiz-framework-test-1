(function () {
  const base = window.PHYSIO_RAPID_BASE;
  const full = window.PHYSIO_CONTENT;
  const upgradeIds = new Set(["endocrine", "reproduction"]);

  if (!base || !full) {
    console.error("無法載入內分泌／生殖完整內容。");
    return;
  }

  const fullUnits = new Map(full.units.map((unit) => [unit.id, unit]));
  base.units = base.units.map((unit) =>
    upgradeIds.has(unit.id) && fullUnits.has(unit.id)
      ? fullUnits.get(unit.id)
      : unit
  );

  window.PHYSIO_CONTENT = base;
  delete window.PHYSIO_RAPID_BASE;
})();
