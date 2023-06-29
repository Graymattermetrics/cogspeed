import axios from "axios";

import { describe, expect, it, jest } from "@jest/globals";

import { CogSpeedGame } from "../src/game";

jest.spyOn(global, "setTimeout");

let config: { [key: string]: any };
const timeouts: NodeJS.Timeout[] = [];

beforeAll(async () => {
  const response = await axios.get(
    "https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig"
  );
  config = response.data;
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  for (const timeout of timeouts) {
    clearTimeout(timeout);
  }
});

const createGame = (round: 0 | 1 | 2 | 3 | 4 | 5) => {
  const game = new CogSpeedGame(config);
  // Go to the round we want to test
  game.currentRound = round;
	if (round >= 2) game.currentTimeout = 1000;

  // Mock the stop function
  // @ts-ignore
  game.stop = jest.fn();
  game.start(0);


  for (const timeout of [game.currentRoundTimeout, game.maxTestTimeout]) {
    if (timeout) timeouts.push(timeout);
  }
  return game;
};

describe("Test game algorithm", () => {
  it("should use the config variable", () => {
    // Use the config variable in your test assertions
    expect(config).toBeDefined();
    expect(config.control).toEqual(true);
  });

  it("[game] should create a game", async () => {
    const game = createGame(0);
    expect(game).toBeDefined();
    expect(game.currentRound).toBe(0); // Should be in training round
    expect(game.previousAnswers).toEqual([]);
    expect(setTimeout).toHaveBeenCalledTimes(1);
  });

  it("[tr] should have n training rounds", async () => {
    const game = createGame(0);
    // We perform the same number of clicks as there are training rounds
    for (let i = 0; i < config.self_paced.number_of_training_rounds; i++) {
      game.buttonClicked(0); // We don't care where it is clicked
    }
    expect(game.currentRound).toBe(1);
    expect(game.previousAnswers.length).toEqual(config.self_paced.number_of_training_rounds);
    expect(setTimeout).toHaveBeenCalledTimes(2);
  });

  it("[sp] should exit self paced mode if there are n wrong answers", async () => {
    const game = createGame(1);

    // Click the wrong answer n times
    for (let i = 0; i < config.self_paced.max_wrong_count; i++) {
      game.buttonClicked(-1); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(1);
    expect(game.previousAnswers.length).toEqual(config.self_paced.max_wrong_count);
  });

  it("[sp] should exit self paced mode if there are n correct answers but not m correct answers in a row", async () => {
    const game = createGame(1);

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

	it("[sp] should not exist self paced mode if the correct answers are > than n seconds", async() => {
		const game = createGame(1);

    // Click the right answer n times but add in a wrong answer
		// Eg 12 / 3 = 4
    for (let i = 0; i < 4; i++) {
      game.buttonClicked(game.answer, (i+1) * config.self_paced.max_correct_duration + 1); // Right answer (>3000ms delay)
      game.buttonClicked(game.answer, (i+1) * config.self_paced.max_correct_duration + 3001); // Right answer
      game.buttonClicked(game.answer, (i+1) * config.self_paced.max_correct_duration + 6001); // Right answer		
			if (i != 3) game.buttonClicked(-1, (i+1) * config.self_paced.max_correct_duration + 9001); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(0);
	});

	it("[sp] should exit self paced startup mode if there are n correct answers in a row", async () => {
		const game = createGame(1);
		
		for (let i = 0; i < config.self_paced.max_right_count; i ++) {
			game.buttonClicked(game.answer, (i+1) * 1000); // Right answer with +1000ms delay each time
		}
		expect(game.currentRound).toBe(2);
		expect(game.currentTimeout).toBe(1000 - config.machine_paced.slowdown.base_duration);
    expect(game.stop).toHaveBeenCalledTimes(0);
    expect(setTimeout).lastCalledWith(expect.any(Function), 1000 - config.machine_paced.slowdown.base_duration);
	});

	it("[mp] should enter post block mode if there are n answers without response", async () => {
		const game = createGame(2);

		for (let i = 0; i < config.machine_paced.blocking.no_input_count; i ++) {
			game.buttonClicked(); // No answer
		}
		expect(game.currentRound).toBe(3);
    expect(setTimeout).lastCalledWith(expect.any(Function), config.machine_paced.blocking.no_response_duration);
	});

	it("[mp] should enter self paced restart mode if the roll mean limit is exceeded", async () => {
		const game = createGame(2);

    const thresholdNumber = Math.trunc(config.machine_paced.rolling_average.mean_size * config.machine_paced.rolling_average.threshold) + 1;
		for (let i = 0; i < thresholdNumber; i ++) {
			game.buttonClicked(-1); // Wrong answer
		} 
    expect(game.currentRound).toBe(4);
	});

  it("[mp] should speedup after correct answer", () => {
    const game = createGame(2);
    let timeout = game.currentTimeout;

    game.buttonClicked(game.answer, 500); // Right answer (500ms)
    timeout += (500 / timeout - 1) * config.machine_paced.speedup.speedup_with_ratio_amount;
    expect(game.currentTimeout).toBe(timeout)

    game.buttonClicked(game.answer, 1000); // Right answer (500ms + 500ms)
    timeout += (500 / timeout - 1) * config.machine_paced.speedup.speedup_with_ratio_amount;
    console.log(game.currentTimeout, timeout)
    expect(game.currentTimeout).toBe(timeout)
    
    game.buttonClicked(game.answer, 1000 + timeout); // Right answer (1000 + timeout ms)
    expect(game.currentTimeout).toBe(timeout)
  });

  it("[mp] should slowdown after wrong answer", () => {
    const game = createGame(2);
    let timeout = game.currentTimeout;
    
    game.buttonClicked(-1); // Wrong answer (ignores time)
    timeout += config.machine_paced.slowdown.base_duration;
    expect(game.currentTimeout).toBe(timeout)

    game.buttonClicked(-1); // Wrong answer (ignores time)
    timeout += config.machine_paced.slowdown.base_duration;
    expect(game.currentTimeout).toBe(timeout)
  });

  it("[pb] should exit with n correct answers in a row", () => {
    const game = createGame(3);

    for (let i = 0; i < config.machine_paced.blocking.min_correct_answers; i++) {
      game.buttonClicked(game.answer, 100); // Right answer
    }
    expect(game.currentRound).toBe(2);
  });

  it("[pb] should exit with n wrong answers overall", () => {
    const game = createGame(3);

    for (let i = 0; i < config.machine_paced.blocking.max_wrong_answers; i++) {
      game.buttonClicked(game.answer); // Right answer
      game.buttonClicked(-1); // Wrong answer
    }
    expect(game.stop).toHaveBeenCalledTimes(1);
  });
});
