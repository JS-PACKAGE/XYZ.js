import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../src/index.js';

const initialLevel = logger.level;

afterEach(() => {
  logger.level = initialLevel;
  vi.restoreAllMocks();
});

describe('public logger', () => {
  it('filters each severity and suppresses all output in silent mode', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const value = new Error('diagnostic');

    logger.level = 'warn';
    logger.debug(value);
    logger.info(value);
    logger.warn(value);
    logger.error(value);
    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[XYZ]', value);
    expect(error).toHaveBeenCalledWith('[XYZ]', value);

    logger.level = 'info';
    logger.info(value);
    expect(info).toHaveBeenCalledWith('[XYZ]', value);
    expect(debug).not.toHaveBeenCalled();

    logger.level = 'debug';
    logger.debug(value);
    expect(debug).toHaveBeenCalledWith('[XYZ]', value);

    logger.level = 'silent';
    logger.debug(value);
    logger.info(value);
    logger.warn(value);
    logger.error(value);
    expect(debug).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
