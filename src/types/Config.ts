/**
 * Represents config type. This is the config used to determine all factors
 * and constants within the game.
 * @see https://github.com/Graymattermetrics/config/blob/main/config.yaml
 */
export interface Config {
  version: string;

  // If the config failed due to incorrect versioning, both error and reason
  // are present in the config body
  error?: string;
  reason?: string;

  // Dynamic keys
  // TODO: Explicitly type each key
  [key: string]: any;
}
