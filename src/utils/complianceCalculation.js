// --------- Hand Hygiene Compliance ---------

function calculateHandHygieneCompliance(auditData) {
  let selectedMoment = '';
  const momentDetails = {};

  if (auditData.opportunityType && auditData.opportunityType.length > 0) {
    selectedMoment = auditData.opportunityType[0];
    momentDetails[selectedMoment] = true;
  } else if (auditData.moments) {
    const momentMapping = {
      beforePatientContact: 'Moment 1 - Before touching patients',
      beforeAsepticProcedure: 'Moment 2 - Before Clean Procedure',
      afterBodyFluidExposure: 'Moment 3 - After risk of body fluid exposure',
      afterPatientContact: 'Moment 4 - After touching the Patients',
      afterPatientSurroundings: 'Moment 5 - After touching surroundings'
    };
    const selectedKey = Object.keys(auditData.moments).find(key => auditData.moments[key]);
    if (selectedKey) {
      selectedMoment = momentMapping[selectedKey] || selectedKey;
      momentDetails[selectedMoment] = true;
    }
  }

  const timeDuration = auditData.handRubDuration?.[0] || auditData.timeDuration || '';
  const stepsAdherence = auditData.adherenceSteps?.[0] || auditData.adherenceToTechnique || '';

  let complianceStatus = '';
  let score = 0;

  if (!timeDuration || !stepsAdherence) {
    complianceStatus = '';
    score = 0;
  } else if (
    timeDuration === '0 sec' || stepsAdherence === '0 Steps' ||
    (timeDuration === '0 sec' && stepsAdherence === 'Less than 3') ||
    (timeDuration === '0 sec' && stepsAdherence === '3 to 5 steps')
  ) {
    complianceStatus = 'No Hand Hygiene';
    score = 0;
  } else if (
    (['>20 sec', '10-20 sec'].includes(timeDuration)) &&
    (['6 Steps', '3 to 5 steps'].includes(stepsAdherence))
  ) {
    complianceStatus = 'Adequate';
    score = 100;
  } else if (
    (timeDuration === '<10 sec' && stepsAdherence === '6 Steps') ||
    (['>20 sec', '10-20 sec'].includes(timeDuration) && stepsAdherence === 'Less than 3') ||
    (timeDuration === '<10 sec' && ['3 to 5 steps', 'Less than 3'].includes(stepsAdherence))
  ) {
    complianceStatus = 'Needs Improvement';
    score = 50;
  } else {
    complianceStatus = 'Needs Improvement';
    score = 50;
  }

  return {
    score: Math.round(score * 100) / 100,
    totalFields: 1,
    completedFields: selectedMoment ? 1 : 0,
    details: {
      complianceStatus,
      selectedMoment,
      timeDuration,
      stepsAdherence,
      moments: momentDetails,
      technique: auditData.adherenceSteps || [stepsAdherence],
      duration: auditData.handRubDuration || [timeDuration],
      gloves: {
        required: auditData.glovesRequired,
        used: auditData.glovesUsed
      }
    }
  };
}

// --------- Hand Wash (SUMANK) Compliance ---------

function calculateSUMANKCompliance(stepDetails) {
  const sumankSteps = {
    S: stepDetails.rubPalmToPalm,
    U: stepDetails.rightPalmOverLeft,
    M: stepDetails.backOfFingers,
    A: stepDetails.rotationalRubbingThumb,
    N: stepDetails.rotationalRubbingFingers,
    K: stepDetails.wrist
  };
  const completed = Object.values(sumankSteps).filter(Boolean).length;
  const score = (completed / 6) * 100;
  return {
    steps: sumankSteps,
    completedSteps: completed,
    totalSteps: 6,
    score: Math.round(score * 100) / 100
  };
}

function calculateHandWashCompliance(auditData) {
  const steps = [
    'wetHands', 'appliedSoap', 'rubPalmToPalm', 'rightPalmOverLeft', 'palmToPalmInterlaced',
    'backOfFingers', 'rotationalRubbingThumb', 'rotationalRubbingFingers', 'wrist',
    'rinseHands', 'dryHandsTowel', 'airDryer', 'turnOffFaucet'
  ];

  let completed = 0;
  const stepDetails = {};
  steps.forEach(key => {
    const done = auditData[key] === 'Yes';
    stepDetails[key] = done;
    if (done) completed++;
  });

  let complianceStatus = '';
  let score = 0;
  if (completed >= 10 && completed <= 12) {
    complianceStatus = 'Adequate';
    score = 85;
  } else if (completed >= 7 && completed <= 9) {
    complianceStatus = 'Needs Improvement';
    score = 65;
  } else {
    complianceStatus = 'Poor';
    score = 30;
  }

  return {
    score: Math.round(score * 100) / 100,
    totalFields: steps.length,
    completedFields: completed,
    details: {
      complianceStatus,
      completedSteps: completed,
      totalSteps: steps.length,
      steps: stepDetails,
      sumankCompliance: calculateSUMANKCompliance(stepDetails),
      criticalStepsCompleted: ['rubPalmToPalm', 'rightPalmOverLeft', 'backOfFingers', 'rotationalRubbingThumb', 'rotationalRubbingFingers', 'wrist'].filter(s => stepDetails[s]).length,
      totalCriticalSteps: 6
    }
  };
}

// --------- CLABSI Compliance ---------

function calculateCLABSICompliance(auditData) {
  const bundleType = auditData.bundleChecklist || auditData.bundleType;
  let relevant = [], critical = [];
  switch (bundleType) {
    case 'Insertion Bundle':
      relevant = [
        'indication', 'electiveEmergency', 'suppliesArranged', 'catheterTypes', 'site', 'washHandsDuring', 'ppeAsepsis', 'checkEquipment', 'allLumensFlushed', 'sitePreparation', 'asepticPrecautions', 'appropriateSteps', 'numberOfPricks', 'haemostasisAchieved', 'fixedWithPad', 'needleFreeConnector', 'handwashAfterGloves', 'ultrasoundGuidance', 'positionConfirm', 'fixedAt', 'dateTimeInsertion'
      ];
      critical = ['washHandsDuring', 'ppeAsepsis', 'sitePreparation', 'asepticPrecautions', 'handwashAfterGloves'];
      break;
    case 'Maintenance Bundle':
      relevant = [
        'washHandsMaintenance', 'assessedNeed', 'sterileDressing', 'eachLumenFlushed', 'noErythema', 'washHandsHubCare', 'wearSterileGloves', 'scrubPort', 'sterileField'
      ];
      critical = ['washHandsMaintenance', 'sterileDressing', 'washHandsHubCare', 'wearSterileGloves'];
      break;
    case 'Removal Bundle':
      relevant = ['dateOfRemoval', 'reasonForRemoval', 'tipCultureSent'];
      critical = ['tipCultureSent'];
      break;
    default:
      return { score: 0, totalFields: 0, completedFields: 0, details: {} };
  }

  let completed = 0, completedCrit = 0;
  const fieldDetails = {};
  relevant.forEach(f => {
    const val = auditData[f];
    const done = val === 'Yes' || (!!val && val !== '' && val !== 'No');
    fieldDetails[f] = { value: val, completed: done };
    if (done) {
      completed++;
      if (critical.includes(f)) completedCrit++;
    }
  });

  const critWeight = 0.7, regWeight = 0.3;
  const critScore = critical.length ? (completedCrit / critical.length) * critWeight * 100 : 0;
  const regScore = relevant.length > critical.length
    ? ((completed - completedCrit) / (relevant.length - critical.length)) * regWeight * 100
    : 0;
  const score = critScore + regScore;

  return {
    score: Math.round(score * 100) / 100,
    totalFields: relevant.length,
    completedFields: completed,
    details: {
      bundleType,
      fields: fieldDetails,
      criticalFieldsCompleted: completedCrit,
      totalCriticalFields: critical.length,
      criticalScore: Math.round(critScore * 100) / 100,
      regularScore: Math.round(regScore * 100) / 100
    }
  };
}

// --------- NIV Compliance ---------

function calculateNIVCompliance(auditData) {
  const common = [
    'appropriateSize', 'skinBarrier', 'gapNasalSeptum', 'skinBlanched', 'nasalTrauma',
    'prongsSecured', 'tractionInterface', 'circuitSecured', 'gentleMassage', 'humidification'
  ];
  let specific = [];
  const type = auditData.respiratorySupport;
  if (type === 'CPAP') specific = ['typeOfCPAP', 'nasalInterfaceCPAP', 'snugFitCPAP', 'bubblingPresent'];
  if (type === 'NIPPV') specific = ['nasalInterfaceNIPPV', 'snugFitNIPPV'];
  if (type === 'HFNC') specific = ['nasalInterfaceHFNC', 'naresCoveredHFNC'];
  const all = [...common, ...specific];
  let completed = 0;
  const fieldDetails = {};
  let traumaScore = 0;
  if (auditData.nasalTrauma === 'No trauma') traumaScore = 100;
  else if (auditData.nasalTrauma === 'Stage 1 - Non blanching erythema') traumaScore = 75;
  else if (auditData.nasalTrauma === 'Stage 2 - Superficial erosion') traumaScore = 50;
  else if (auditData.nasalTrauma === 'Stage 3 - Necrosis of skin') traumaScore = 0;
  all.forEach(f => {
    const val = auditData[f];
    const done = val === 'Yes' || (!!val && val !== '' && val !== 'No');
    fieldDetails[f] = { value: val, completed: done };
    if (done) completed++;
  });
  const commonScore = common.length ? (common.filter(f => fieldDetails[f]?.completed).length / common.length) * 60 : 0;
  const specScore = specific.length ? (specific.filter(f => fieldDetails[f]?.completed).length / specific.length) * 30 : 0;
  const trauma = traumaScore * 0.1;
  const score = commonScore + specScore + trauma;
  return {
    score: Math.round(score * 100) / 100,
    totalFields: all.length,
    completedFields: completed,
    details: {
      respiratorySupport: type,
      fields: fieldDetails,
      nasalTrauma: { value: auditData.nasalTrauma, score: traumaScore },
      commonFieldsScore: Math.round(commonScore * 100) / 100,
      specificFieldsScore: Math.round(specScore * 100) / 100,
      nasalTraumaScore: Math.round(trauma * 100) / 100
    }
  };
}

// --------- VAP Compliance ---------

function calculateVAPCompliance(auditData) {
  const bundleType = auditData.bundleType;
  let fields = [], total = 0, completed = 0;
  switch (bundleType) {
    case 'Intubation Bundle':
      fields = [
        'preSupplies', 'preETSize', 'preETDepth', 'procMask',
        'procHandWash', 'procAseptic', 'procSteps', 'procHandRubAfter'
      ]; total = 8; break;
    case 'Maintenance Bundle':
      fields = [
        'humidHeated', 'humidGasTemp', 'humidAutoRefill', 'humidSterileWater', 'humidCondensation', 'humidDrain', 'equipCircuits',
        'equipClean', 'equipHandHygiene', 'equipPosition', 'infantHeadElevation', 'infantPositionChange', 'oralSuction', 'oralColostrum', 'ogFeeds', 'extubSedation', 'extubReadiness'
      ]; total = 17; break;
    case 'ET Suction Bundle':
      fields = [
        'etSuctionClinical', 'etSuctionHandHygiene', 'etSuctionSterile', 'etSuctionCatheter', 'etSuctionProtected', 'etSuctionAseptic', 'etSuctionSaline', 'etSuctionOralNasal', 'etSuctionDisposal'
      ]; total = 9; break;
    case 'Extubation Bundle':
      fields = [
        'extubReason', 'extubVentilatorSettings', 'extubDrugs', 'extubStability', 'extubBreathingTrial', 'extubTwoPeople', 'extubSupplies', 'extubSteps', 'extubRespiratory'
      ]; total = 9; break;
    case 'Post-Extubation Care Bundle':
      fields = ['postExtubRespiratory', 'postExtubNebulization', 'postExtubPosition', 'postExtubSuction', 'postExtubMonitoring'];
      total = 5; break;
    default:
      return { score: 0, totalFields: 0, completedFields: 0, details: {} };
  }
  const fieldDetails = {};
  fields.forEach(field => {
    let done = false, val = auditData[field];
    switch (bundleType) {
      case 'Maintenance Bundle':
        if (field === 'equipCircuits') done = val === 'New' || val === 'Reused but sterile';
        else if (field === 'extubSedation') done = val === 'Stopped' || val === 'Sedation stopped or not started';
        else done = val === 'Yes';
        break;
      case 'Extubation Bundle':
        if (field === 'extubReason') done = val === 'Planned Extubation';
        else if (field === 'extubVentilatorSettings') done = val === 'Extubatable';
        else if (field === 'extubBreathingTrial') done = val === 'Passed';
        else done = val === 'Yes';
        break;
      default:
        done = val === 'Yes';
    }
    fieldDetails[field] = { value: val, completed: done };
    if (done) completed++;
  });
  const score = total > 0 ? (completed / total) * 100 : 0;
  return {
    score: Math.round(score * 100) / 100,
    totalFields: total,
    completedFields: completed,
    details: {
      bundleType,
      fields: fieldDetails,
      completedSteps: completed,
      totalSteps: total,
      compliancePercentage: Math.round((completed / total) * 100 * 100) / 100
    }
  };
}

// --------- Disinfection Compliance ---------

function calculateDisinfectionCompliance(auditData) {
  const type = auditData.taskType;
  let fields = [], frequency = 'daily';
  switch (type) {
    case 'dailyTasks':
      fields = ['transportIncubator', 'laminarFlow', 'neopuff', 'suctionJars', 'intubationTray', 'bottleSteriliser', 'chitelForceps', 'bedsideTrays', 'milkPrepTrays', 'weighingMachine'];
      frequency = 'daily'; break;
    case 'afterUseTasks':
      fields = ['laryngoscope', 'ventilatorCircuit', 'ambuBag', 'oxygenJars'];
      frequency = 'after_use'; break;
    case 'weeklyTasks':
      fields = ['fridge', 'cpapVentilators', 'warmers', 'incubators'];
      frequency = 'weekly'; break;
    default:
      return { score: 0, totalFields: 0, completedFields: 0, details: {} };
  }
  let completed = 0;
  const taskDetails = {};
  fields.forEach(f => {
    const done = auditData[f] === 'Yes';
    taskDetails[f] = { completed: done, value: auditData[f] };
    if (done) completed++;
  });
  let score = fields.length ? (completed / fields.length) * 100 : 0;
  let multiplier = 1;
  if (frequency === 'after_use') multiplier = 1.2;
  if (frequency === 'weekly') multiplier = 0.9;
  const adjustedScore = Math.min(score * multiplier, 100);

  return {
    score: Math.round(adjustedScore * 100) / 100,
    totalFields: fields.length,
    completedFields: completed,
    details: {
      taskType: type,
      taskFrequency: frequency,
      tasks: taskDetails,
      frequencyMultiplier: multiplier,
      rawScore: Math.round(score * 100) / 100
    }
  };
}

// --------- Main Routing Function ---------

function calculateCompliance(auditType, auditData) {
  switch (auditType) {
    case 'hand_hygiene': return calculateHandHygieneCompliance(auditData);
    case 'hand_wash': return calculateHandWashCompliance(auditData);
    case 'clabsi': return calculateCLABSICompliance(auditData);
    case 'niv': return calculateNIVCompliance(auditData);
    case 'vap': return calculateVAPCompliance(auditData);
    case 'disinfection': return calculateDisinfectionCompliance(auditData);
    default: return { score: 0, totalFields: 0, completedFields: 0, details: {} };
  }
}

// --------- Compliance Level Color/Label ---------

function getComplianceLevel(score) {
  if (score >= 95) {
    return { level: 'Excellent', color: 'green', description: 'Outstanding compliance - exceeds standards' };
  } else if (score >= 90) {
    return { level: 'High', color: 'green', description: 'High compliance - meets standards' };
  } else if (score >= 80) {
    return { level: 'Acceptable', color: 'yellow', description: 'Acceptable compliance - minor improvements needed' };
  } else if (score >= 70) {
    return { level: 'Low', color: 'orange', description: 'Low compliance - significant improvements needed' };
  } else {
    return { level: 'Critical', color: 'red', description: 'Critical compliance - immediate action required' };
  }
}

// ------------ EXPORTS ------------
export {
  calculateCompliance,
  getComplianceLevel,
  calculateHandHygieneCompliance,
  calculateHandWashCompliance,
  calculateCLABSICompliance,
  calculateNIVCompliance,
  calculateVAPCompliance,
  calculateDisinfectionCompliance
};
