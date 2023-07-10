import axios from "axios";

import { describe, expect, it, jest } from "@jest/globals";

import { CogSpeedGame } from "../src/game";

jest.useFakeTimers();
jest.spyOn(global, "setTimeout");

let config: { [key: string]: any };

beforeAll(async () => {
  const response = await axios.get("https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig");
  config = response.data;
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * Creates a game that is currently in training rounds
 */
const createGame = () => {
  const game = new CogSpeedGame(config);

  // Mock the stop function
  // @ts-ignore
  game.stop = jest.fn();
  game.start(0);

  return game;
};

/**
 * Creates a game that has completed all training rounds
 * and is currently in selfPacedStartup round
 */
const selfPacedStartupGame = () => {
  const game = createGame();
  // We perform the same number of clicks as there are training rounds
  for (let i = 0; i < config.self_paced.number_of_training_rounds; i++) {
    game.buttonClicked(0); // We don't care where it is clicked
  }
  return game;
};

/**
 * Creates a game that has completed the self paced startup rounds
 * and is currently in machinePacedStartup round
 */
const machinePacedGame = () => {
  const game = selfPacedStartupGame();

  for (let i = 0; i < config.self_paced.max_right_count; i++) {
    game.buttonClicked(game.answer, (i + 1) * 1000); // Right answer with +1000ms delay each time
  }
  return game;
};

/**
 * Creates a game that is in post block round
 */
const postBlockGame = () => {
  const game = machinePacedGame();

  for (let i = 0; i < config.machine_paced.blocking.no_input_count; i++) {
    game.buttonClicked(); // No answer
  }
  return game;
};

describe("Test game algorithm", () => {
  it("should use the config variable", () => {
    // Use the config variable in your test assertions
    expect(config).toBeDefined();
    expect(config.error).toEqual(false);
  });

  it("should never show the same query twice in a row", () => {
    const game = createGame();
    game.nextRound();

    let query = game.query;
    for (let i = 0; i < 10000; i++) {
      // Iterate 5000 times to make sure we don't get the same query twice
      // because of randomization
      game.nextRound();
      expect(game.query).not.toEqual(query);
      query = game.query;
    }
  });

  it("[game] should create a game", async () => {
    const game = createGame();
    expect(game).toBeDefined();
    expect(game.currentRound).toBe(0); // Should be in training round
    expect(game.previousAnswers).toEqual([]);
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout).toBeCalledWith(expect.any(Function), config.timeouts.max_initial_no_response);
    expect(setTimeout).toBeCalledWith(expect.any(Function), config.timeouts.max_test_duration);
  });

  it("[tr] should have n training rounds", async () => {
    const game = selfPacedStartupGame();
    expect(game.currentRound).toBe(1);
    expect(game.previousAnswers.length).toEqual(config.self_paced.number_of_training_rounds);
    expect(setTimeout).toHaveBeenCalledTimes(3);
  });

  it("[sp] should fail self paced mode if there are n wrong answers", async () => {
    const game = selfPacedStartupGame();

    // Click the wrong answer n times
    for (let i = 0; i < config.self_paced.max_wrong_count; i++) {
      game.buttonClicked(-1); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(1);
    expect(game.previousAnswers.length).toEqual(config.self_paced.number_of_training_rounds + config.self_paced.max_wrong_count);
  });

  it("[sp] should fail self paced mode if there are n correct answers but not m correct answers in a row", async () => {
    const game = selfPacedStartupGame();

    // Click the right answer n times but add in a wrong answer
    // Eg 12 / 3 = 4
    for (let i = 0; i < 4; i++) {
      game.buttonClicked(game.answer, 100); // Right answer (<3000ms delay)
      game.buttonClicked(game.answer, 100); // Right answer
      game.buttonClicked(game.answer, 100); // Right answer
      if (i != 3) game.buttonClicked(-1, 100); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(1);
  });

  it("[sp] should not exit self paced mode if the correct answers are > than n seconds", async () => {
    const game = selfPacedStartupGame();

    // Click the right answer n times but add in a wrong answer
    // Eg 12 / 3 = 4
    for (let i = 0; i < 4; i++) {
      game.buttonClicked(game.answer, (i + 1) * config.self_paced.max_correct_duration + 1); // Right answer (>3000ms delay)
      game.buttonClicked(game.answer, (i + 1) * config.self_paced.max_correct_duration + 3001); // Right answer
      game.buttonClicked(game.answer, (i + 1) * config.self_paced.max_correct_duration + 6001); // Right answer
      if (i != 3) game.buttonClicked(-1, (i + 1) * config.self_paced.max_correct_duration + 9001); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(0);
  });

  it("[sp] should exit self paced startup mode if there are n correct answers in a row", async () => {
    const game = machinePacedGame();
    expect(game.currentRound).toBe(2);
    expect(game.currentTimeout).toBe(1000 - config.machine_paced.slowdown.base_duration);
    expect(game.stop).toHaveBeenCalledTimes(0);
    expect(setTimeout).lastCalledWith(expect.any(Function), 1000 - config.machine_paced.slowdown.base_duration);
  });

  it("[mp] should speedup after correct answer", () => {
    const game = machinePacedGame();
    // Reset the time of the previous answer so 500 is +500ms
    game.previousAnswers[game.previousAnswers.length - 1]._time_epoch = 0;

    let timeout = game.currentTimeout;

    game.buttonClicked(game.answer, 500); // Right answer (500ms)
    timeout += (500 / timeout - config.machine_paced.speedup.weighting) * config.machine_paced.speedup.speedup_with_ratio_amount;
    expect(game.currentTimeout).toBe(timeout);

    game.buttonClicked(game.answer, 1000); // Right answer (500ms + 500ms)
    timeout += (500 / timeout - config.machine_paced.speedup.weighting) * config.machine_paced.speedup.speedup_with_ratio_amount;
    expect(game.currentTimeout).toBe(timeout);
  });

  it("[mp] should slowdown after wrong answer", () => {
    const game = machinePacedGame();
    let timeout = game.currentTimeout;

    game.buttonClicked(-1); // Wrong answer (ignores time)
    timeout += config.machine_paced.slowdown.base_duration;
    expect(game.currentTimeout).toBe(timeout);

    game.buttonClicked(-1); // Wrong answer (ignores time)
    timeout += config.machine_paced.slowdown.base_duration;
    expect(game.currentTimeout).toBe(timeout);
  });

  it("[spr] should enter self paced restart mode if the roll mean limit is exceeded", async () => {
    const game = machinePacedGame();

    const thresholdNumber =
      Math.trunc(config.machine_paced.rolling_average.mean_size * config.machine_paced.rolling_average.threshold) + 1;
    for (let i = 0; i < thresholdNumber; i++) {
      game.buttonClicked(-1); // Wrong answer
    }
    expect(game.currentRound).toBe(4);
  });

  it("[pb] should enter post block mode if there are n answers without response", async () => {
    const game = postBlockGame();
    expect(game.currentRound).toBe(3);
    expect(setTimeout).lastCalledWith(expect.any(Function), config.machine_paced.blocking.no_response_duration);
  });

  it("[pb] should exit with n correct answers in a row", () => {
    const game = postBlockGame();

    for (let i = 0; i < config.machine_paced.blocking.min_correct_answers; i++) {
      game.buttonClicked(game.answer, 100); // Right answer
    }
    expect(game.currentRound).toBe(2);
  });

  it("[pb] should exit with n wrong answers overall", () => {
    const game = postBlockGame();

    for (let i = 0; i < config.machine_paced.blocking.max_wrong_answers; i++) {
      game.buttonClicked(game.answer); // Right answer
      game.buttonClicked(-1); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(1);
  });

  it("should not be stuck in recursion if it goes from machine paced to self paced startup", () => {
    const game = machinePacedGame();

    for (let i = 0; i < config.self_paced.max_right_count; i++) {
      game.buttonClicked(game.answer, (i + 1) * 1000); // Right answer with +1000ms delay each time
    }
    expect(game.currentRound).toBe(2);

    const thresholdNumber =
      Math.trunc(config.machine_paced.rolling_average.mean_size * config.machine_paced.rolling_average.threshold) + 1;
    for (let i = 0; i < thresholdNumber; i++) {
      game.buttonClicked(-1); // Wrong answer
    }
    expect(game.currentRound).toBe(4);

    // Return to machine paced
    game.buttonClicked(game.answer, 10000); // Right answer (500ms)
    game.buttonClicked(game.answer, 11000); // Right answer (500ms)
  });
});
