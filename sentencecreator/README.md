# The Sentence Creator
It is a python script that  takes in a list of words in English as a CSV file, and has chatGPT create sentences that get saved in an output CSV file
_Note: This code is a poc quality script_

# Setup
## Install `poetry` on your machine
```
curl -sSL https://install.python-poetry.org | python3 -
```
## Verify the installation
```
poetry --version
```
## Install dependencies
```
poetry install
```

## Activate shell
```
poetry shell
```

# Prepare your list of words
See words.csv as a sample

# Get your OpenAI APIKey
* Get your api key from https://platform.openai.com/account/api-keys. It is a paid service.
* Add it as an environment variable in your shell
```bash
export OPENAI_API_KEY=<ADD YOUR KEY>
```
# Run the script
```bash
poetry run python sentencecreator.py <csv file name with words>
```
e.g.
```
poetry run python sentencecreator.py words.csv
```

Note: it takes a while for the sentences to be generated

## Tweaking the results
* Can be done with the fields in config.py
* or the prompt in code

