import { ExerciseDefinition } from '../types/domain';

export const EXERCISE_DEFINITIONS: ExerciseDefinition[] = [
  { key: 'normalPushups', label: 'Normal Pushups', group: 'pushups' },
  { key: 'inclinePushups', label: 'Incline Pushups', group: 'pushups' },
  { key: 'declinePushups', label: 'Decline Pushups', group: 'pushups' },
  { key: 'widePushups', label: 'Wide Pushups', group: 'pushups' },
  { key: 'diamondPushups', label: 'Diamond Pushups', group: 'pushups' },
  { key: 'hinduPushups', label: 'Hindu Pushups', group: 'pushups' },
  { key: 'pikePushups', label: 'Pike Pushups', group: 'pushups' },
  { key: 'pullUps', label: 'Pull-ups', group: 'upperBody' },
  { key: 'chinUps', label: 'Chin-ups', group: 'upperBody' },
  { key: 'dips', label: 'Dips', group: 'upperBody' },
  { key: 'squats', label: 'Squats', group: 'legs' },
  { key: 'sumoSquats', label: 'Sumo Squats', group: 'legs' },
  { key: 'jumpSquats', label: 'Jump Squats', group: 'legs' },
  { key: 'lunges', label: 'Lunges', group: 'legs' },
];

export const EXERCISE_GROUPS = [
  { id: 'pushups', title: 'Pushups' },
  { id: 'upperBody', title: 'Upper Body' },
  { id: 'legs', title: 'Legs Workout' },
] as const;
