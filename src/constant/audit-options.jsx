import React from 'react';
import {
    Stethoscope,
    UserRound,
    Trash2,
    Scan,
    Users,
    Hand,
    Syringe,
    Droplets,
    Activity,
    LayoutDashboard,
    AlertTriangle,
    CheckCircle,
    X,
    Clock,
    Thermometer,
    FileText,
    Calendar,
    AlertCircle,
    Wind,
    Zap,
    ThermometerSun,
    ClipboardList,
    CalendarDays,
    Repeat,
    CalendarClock
} from 'lucide-react';

export const hcpOptions = [
    { value: 'Doctor', label: 'Doctor', icon: <Stethoscope size={20} /> },
    { value: 'Nurse', label: 'Nurse', icon: <UserRound size={20} /> },
    { value: 'Housekeeping', label: 'Housekeeping', icon: <Trash2 size={20} /> },
    { value: 'Radiology', label: 'Radiology', icon: <Scan size={20} /> },
    { value: 'Others', label: 'Others', icon: <Users size={20} /> },
];

export const opportunityTypes = [
    { value: 'Moment 1 - Before touching patients', label: 'Moment 1', description: 'Before touching patient', icon: <Hand size={20} /> },
    { value: 'Moment 2 - Before Clean Procedure', label: 'Moment 2', description: 'Before clean/aseptic procedure', icon: <Syringe size={20} /> },
    { value: 'Moment 3 - After risk of body fluid exposure', label: 'Moment 3', description: 'After body fluid exposure risk', icon: <Droplets size={20} /> },
    { value: 'Moment 4 - After touching the Patients', label: 'Moment 4', description: 'After touching patient', icon: <Activity size={20} /> },
    { value: 'Moment 5 - After touching surroundings', label: 'Moment 5', description: 'After touching surroundings', icon: <LayoutDashboard size={20} /> },
];

export const adherenceStepsOptions = [
    { value: 'Less than 3', label: '< 3 Steps', icon: <AlertTriangle size={20} /> },
    { value: '3 to 5 steps', label: '3-5 Steps', icon: <CheckCircle size={20} /> },
    { value: '6 Steps', label: '6 Steps (Full)', icon: <CheckCircle size={20} /> },
    { value: '0 Steps', label: '0 Steps (Missed)', icon: <X size={20} /> },
];

export const handRubDurationOptions = [
    { value: '<10 sec', label: '< 10 sec', icon: <Clock size={20} /> },
    { value: '10-20 sec', label: '10-20 sec', icon: <Clock size={20} /> },
    { value: '>20 sec', label: '> 20 sec', icon: <Clock size={20} /> },
    { value: '0 sec', label: '0 sec', icon: <X size={20} /> },
];

export const glovesRequiredForOptions = [
    { value: 'Intubation', label: 'Intubation', icon: <Activity size={18} /> },
    { value: 'IV line insertion', label: 'IV Line', icon: <Syringe size={18} /> },
    { value: 'Central line insertion', label: 'Central Line', icon: <Activity size={18} /> },
    { value: 'Central line Maintenance', label: 'Line Maint.', icon: <Activity size={18} /> },
    { value: 'Drug administration', label: 'Drugs', icon: <Thermometer size={18} /> },
    { value: 'Other', label: 'Other', icon: <Users size={18} /> },
];

export const yesNoOptions = [
    { value: 'Yes', label: 'Yes', icon: <CheckCircle size={18} /> },
    { value: 'No', label: 'No', icon: <X size={18} /> }
];

export const handWashSteps = [
    { label: "Wet hands with water", key: "wetHands", icon: <Droplets size={20} /> },
    { label: "Applied soap", key: "appliedSoap", icon: <Droplets size={20} /> },
    { label: "Rub palm to palm (S)", key: "rubPalm", icon: <Hand size={20} /> },
    { label: "Right palm over left dorsum (U)", key: "rightOverLeft", icon: <Hand size={20} /> },
    { label: "Palm to palm interlaced", key: "palmInterlaced", icon: <Hand size={20} /> },
    { label: "Back of fingers to palms (M)", key: "backFingers", icon: <Hand size={20} /> },
    { label: "Rotational rubbing of thumb (A)", key: "rotThumb", icon: <Hand size={20} /> },
    { label: "Rotational rubbing of fingers (N)", key: "rotFingers", icon: <Hand size={20} /> },
    { label: "Wrist (K)", key: "wrist", icon: <Hand size={20} /> },
    { label: "Rinse hands with water", key: "rinseHands", icon: <Droplets size={20} /> },
    { label: "Dry hands with towel", key: "dryHands", icon: <Hand size={20} /> },
    { label: "Use air dryer", key: "airDryer", icon: <Activity size={20} /> },
    { label: "Turn off faucet with towel/elbow", key: "turnOffFaucet", icon: <Hand size={20} /> },
];

export const clabsiBundleOptions = [
    { value: 'Insertion Bundle', label: 'Insertion Bundle', icon: <Syringe size={20} /> },
    { value: 'Maintenance Bundle', label: 'Maintenance Bundle', icon: <Activity size={20} /> },
    { value: 'Removal Bundle', label: 'Removal Bundle', icon: <Trash2 size={20} /> },
];

export const catheterTypes = [
    { value: 'CVC', label: 'CVC', icon: <Activity size={18} /> },
    { value: 'PICC', label: 'PICC', icon: <Activity size={18} /> },
    { value: 'Umbilical catheter', label: 'Umbilical', icon: <Activity size={18} /> },
    { value: 'Feeding Tube', label: 'Feeding Tube', icon: <Activity size={18} /> },
];

export const catheterSites = [
    { value: 'Umbilical', label: 'Umbilical', icon: <Activity size={18} /> },
    { value: 'Peripheral', label: 'Peripheral', icon: <Activity size={18} /> },
    { value: 'Femoral', label: 'Femoral', icon: <Activity size={18} /> },
    { value: 'IJV', label: 'IJV', icon: <Activity size={18} /> },
    { value: 'Subclavian', label: 'Subclavian', icon: <Activity size={18} /> },
];

export const sides = [
    { value: 'Right', label: 'Right', icon: <Activity size={18} /> },
    { value: 'Left', label: 'Left', icon: <Activity size={18} /> },
    { value: 'NA', label: 'N/A', icon: <X size={18} /> },
];

export const limbs = [
    { value: 'Upper', label: 'Upper', icon: <Activity size={18} /> },
    { value: 'Lower', label: 'Lower', icon: <Activity size={18} /> },
    { value: 'NA', label: 'N/A', icon: <X size={18} /> },
];

export const removalReasons = [
    { value: 'Insertion outside', label: 'Insertion outside', icon: <AlertCircle size={18} /> },
    { value: 'Suspected/Confirmed infection at central line insertion site', label: 'Infection', icon: <AlertTriangle size={18} /> },
    { value: 'Patient no longer needs central line', label: 'Not Needed', icon: <CheckCircle size={18} /> },
    { value: 'Central line blocked/not working', label: 'Blocked', icon: <X size={18} /> },
    { value: 'Reached maximum days', label: 'Max Days', icon: <Calendar size={18} /> },
];

export const respiratorySupportOptions = [
    { value: 'CPAP', label: 'CPAP', icon: <Wind size={20} /> },
    { value: 'NIPPV', label: 'NIPPV', icon: <Zap size={20} /> },
    { value: 'HFNC', label: 'HFNC', icon: <ThermometerSun size={20} /> },
];

export const nasalTraumaOptions = [
    { value: 'No trauma', label: 'No trauma', icon: <CheckCircle size={18} /> },
    { value: 'Stage 1 - Non blanching erythema', label: 'Stage 1', description: 'Non blanching erythema', icon: <AlertTriangle size={18} /> },
    { value: 'Stage 2 - Superficial erosion', label: 'Stage 2', description: 'Superficial erosion', icon: <AlertTriangle size={18} /> },
    { value: 'Stage 3 - Necrosis of skin', label: 'Stage 3', description: 'Necrosis of skin', icon: <AlertCircle size={18} /> },
];

export const cpapTypes = [
    { value: 'Bubble CPAP', label: 'Bubble CPAP', icon: <Activity size={18} /> },
    { value: 'Continuous CPAP (Ventilator)', label: 'Continuous CPAP', icon: <Activity size={18} /> },
    { value: 'Variable CPAP', label: 'Variable CPAP', icon: <Activity size={18} /> },
];

export const nasalInterfaces = [
    { value: 'Nasal Mask', label: 'Nasal Mask', icon: <Activity size={18} /> },
    { value: 'Rams Cannula', label: 'Rams Cannula', icon: <Activity size={18} /> },
    { value: 'Short Binasal Prongs', label: 'Short Prongs', icon: <Activity size={18} /> },
    { value: 'IFD', label: 'IFD', icon: <Activity size={18} /> },
    { value: 'Other…', label: 'Other', icon: <Activity size={18} /> },
];

export const hfncInterfaces = [
    { value: 'HFNC Prongs', label: 'HFNC Prongs', icon: <Activity size={18} /> },
    { value: 'Other…', label: 'Other', icon: <Activity size={18} /> },
];

export const vapBundleOptions = [
    { key: 'intubationReintubationBundle', label: 'Intubation Bundle', icon: <Syringe size={20} /> },
    { key: 'maintenanceBundle', label: 'Maintenance Bundle', icon: <Activity size={20} /> },
    { key: 'etSuctionBundle', label: 'ET Suction Bundle', icon: <Wind size={20} /> },
    { key: 'extubationBundle', label: 'Extubation Bundle', icon: <Trash2 size={20} /> },
    { key: 'postExtubationBundle', label: 'Post-Extubation Care', icon: <ClipboardList size={20} /> },
];

export const disinfectionTaskTypes = [
    { value: 'dailyTasks', label: 'Daily Tasks', icon: <CalendarDays size={20} /> },
    { value: 'afterUseTasks', label: 'After Use Tasks', icon: <Repeat size={20} /> },
    { value: 'weeklyTasks', label: 'Weekly Tasks', icon: <CalendarClock size={20} /> },
];
