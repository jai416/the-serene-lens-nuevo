import logging, sys
from config.settings import LOG_LEVEL, LOG_FILE

def setup_logger(name: str = "bot") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))
    fmt = logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    stdout = logging.StreamHandler(sys.stdout)
    stdout.setFormatter(fmt)
    logger.addHandler(stdout)
    try:
        fh = logging.FileHandler(LOG_FILE)
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except:
        pass
    return logger
