import type {
  LabRecord,
  LabSummary,
  LayerSummary,
  Source,
  SummaryCell,
} from "./contracts.js";

type CellAccumulator = Omit<SummaryCell, "layers"> & {
  tagHits: number;
  visibleNoteHits: number;
};

const sourceMode = (sources: Set<Source>): LabSummary["mode"] => {
  if (sources.size > 1) return "MIXED";
  return sources.has("mock") ? "SIMULATED" : "OBSERVED";
};

const layerSummary = (
  hits: number,
  denominator: number,
  source: Source,
): LayerSummary => {
  if (source === "mock") {
    return {
      hits,
      denominator,
      observedFraction: denominator === 0 ? "N/A" : null,
      note:
        denominator === 0
          ? "SIMULATED; N/A: no valid mock responses."
          : "SIMULATED; not an observed fraction.",
    };
  }
  if (denominator === 0) {
    return {
      hits,
      denominator,
      observedFraction: "N/A",
      note: "N/A: no valid completed responses.",
    };
  }
  if (denominator === 1) {
    return {
      hits,
      denominator,
      observedFraction: null,
      note: "Single trial; report counts only, not a rate.",
    };
  }
  return {
    hits,
    denominator,
    observedFraction: `${hits}/${denominator}`,
    note: "Observed fraction only; not population reliability or probability.",
  };
};

export const summarizeRecords = (records: LabRecord[]): LabSummary => {
  const cells = new Map<string, CellAccumulator>();
  const sources = new Set<Source>();

  for (const record of records) {
    sources.add(record.source);
    const key = JSON.stringify([
      record.source,
      record.inputClass,
      record.provider,
      record.model,
      record.providerVersion,
      record.assignmentId,
      record.caseId,
      record.variant,
      record.condition,
      record.manualAcknowledgment ?? null,
    ]);
    let cell = cells.get(key);
    if (!cell) {
      cell = {
        source: record.source,
        inputClass: record.inputClass,
        provider: record.provider,
        model: record.model,
        providerVersion: record.providerVersion,
        assignmentId: record.assignmentId,
        caseId: record.caseId,
        variant: record.variant,
        condition: record.condition,
        ...(record.manualAcknowledgment === undefined
          ? {}
          : { manualAcknowledgment: record.manualAcknowledgment }),
        validResponses: 0,
        technicalErrors: 0,
        tagHits: 0,
        visibleNoteHits: 0,
      };
      cells.set(key, cell);
    }

    if (record.status === "error") {
      cell.technicalErrors += 1;
      continue;
    }

    cell.validResponses += 1;
    cell.tagHits += Number(record.layers[0].carrier === "tag" && record.layers[0].detected);
    cell.tagHits += Number(record.layers[1].carrier === "tag" && record.layers[1].detected);
    cell.visibleNoteHits += Number(
      record.layers[0].carrier === "visibleNote" && record.layers[0].detected,
    );
    cell.visibleNoteHits += Number(
      record.layers[1].carrier === "visibleNote" && record.layers[1].detected,
    );
  }

  const summaryCells: SummaryCell[] = [...cells.values()]
    .map(({ tagHits, visibleNoteHits, ...cell }) => ({
      ...cell,
      layers: {
        tag: layerSummary(tagHits, cell.validResponses, cell.source),
        visibleNote: layerSummary(visibleNoteHits, cell.validResponses, cell.source),
      },
    }))
    .sort((left, right) => {
      const leftKey = JSON.stringify([
        left.source,
        left.inputClass,
        left.provider,
        left.model,
        left.providerVersion,
        left.assignmentId,
        left.caseId,
        left.variant,
        left.condition,
        left.manualAcknowledgment ?? null,
      ]);
      const rightKey = JSON.stringify([
        right.source,
        right.inputClass,
        right.provider,
        right.model,
        right.providerVersion,
        right.assignmentId,
        right.caseId,
        right.variant,
        right.condition,
        right.manualAcknowledgment ?? null,
      ]);
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });

  const mode = sourceMode(sources);
  const note =
    "Input class and exposure condition are caller-supplied labels, not proof of consent or exposure. Per-layer fractions are observed counts only, not population reliability or probability." +
    (mode === "SIMULATED" || mode === "MIXED"
      ? " SIMULATED rows are not measured model behavior and have no empirical fractions."
      : "");

  return {
    schemaVersion: 1,
    mode,
    note,
    cells: summaryCells,
  };
};
