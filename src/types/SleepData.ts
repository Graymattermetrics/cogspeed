/**
 * Represents data related to a user's sleep.
 */
export interface SleepData {
    fatigueLevel: number;

    // TODO: Implement further sleep data such as time in bed, time awake, ...
    [key: string]: any;
}
