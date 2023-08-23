/**
 * Represents a singular answer in the cogspeed game. This answer is used to
 * determine the current round type and speed.
 */
export interface GameAnswer {
    // Correct, incorrect or no response
    status: string;
    // Normalized round type (self-paced, machine-paced, ...)
    roundTypeNormalized: string;
    // Location of the answer sprite (1-6)
    answerLocation: number;
    // Location of the click (1-6) - will match answerLocation if correct
    // Null if the answer was a no response (eg forcibly timed out)
    locationClicked: number | null;
    // The query number concatinated with the numbers or dots
    queryNumber: string;
    // Current duration (timeout)
    duration: number;
    // The correct rolling mean number ("n/a" if not machine-paced round)
    correctRollingMeanRatio: string | number;
    // Round number
    roundNumber: number;
    // Round type (not normalized)
    roundType: 0 | 1 | 2 | 3 | 4 | 5;
    // Time delta between previous answer
    timeTaken: number;
    // If the answer was correct or incorrect from previous
    isCorrectOrIncorrectFromPrevious: "incorrect" | "correct" | null;
    // The ratio of timeTaken to duration
    ratio: number;
    // Time of answer
    _time_epoch: number;
}
