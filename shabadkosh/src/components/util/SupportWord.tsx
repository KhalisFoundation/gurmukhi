import React, {
  useState, Dispatch, SetStateAction,
} from 'react';
import { Form } from 'react-bootstrap';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import regex from '../constants/regex';
import { MiniWord, Option, SentenceType } from '../../types';
import { capitalize } from './utils';

interface IProps {
  id: string;
  name: string;
  word: MiniWord[] | SentenceType[];
  setWord: Dispatch<SetStateAction<(MiniWord | SentenceType)[]>>;
  words: MiniWord[] | SentenceType[];
  type: string;
  placeholder: string;
}

const SupportWord = ({
  id, name, word, setWord, words, type, placeholder,
} : IProps) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [supportWord, setSupportWord] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const { t: text } = useTranslation();

  const onViewToggle = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setShowNewForm(!showNewForm);
  };

  const addNew = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>, option: string) => {
    event.preventDefault();
    if (option.includes(':')) {
      const [gurmukhi, english] = option.split(':').map((val) => val.trim());
      if (gurmukhi.match(regex.gurmukhiWordRegex) && english.match(regex.englishQuestionRegex)) {
        const optionData = {
          value: gurmukhi,
          translation: english,
          label: `${gurmukhi} - ${english.toLowerCase()}`,
        } as Option;

        optionData.word = gurmukhi;

        const duplicate = (word as MiniWord[]).find(
          (obj) => obj.word === optionData.word,
        );
        const alreadyInWords = (words as MiniWord[]).find(
          (obj) => obj.word === optionData.word,
        );

        if (!duplicate) {
          if (!alreadyInWords) {
            setWord((prev) => [...prev, optionData]);
          } else {
            alert(text('ALREADY_EXISTS', { what: name.slice(0, -1) + optionData.value }));
          }
        }

        setSupportWord('');
        setTranslation('');
      } else {
        alert(text('INVALID_VALUE', { val: option }));
      }
    }
  };

  const remWord = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setSupportWord('');
    setTranslation('');
  };

  const onChange = (selectedList: []) => {
    setWord(selectedList);
  };

  return (
    <div>
      <Form.Label>{name}</Form.Label>
      <button
        type="button"
        className="btn btn-sm"
        onClick={onViewToggle}
      >
        {showNewForm ? text('MINUS') : text('PLUS')}
      </button>

      <Multiselect
        id={id}
        options={words}
        displayValue="label"
        showCheckbox
        selectedValues={word}
        onSelect={onChange}
        onRemove={onChange}
      />
      <br />
      <div
        className={showNewForm ? 'd-flex justify-content-around ' : 'd-none'}
      >
        <div>
          {['synonyms', 'antonyms'].includes(type) ? text('WORD') : capitalize(type)}
          <Form.Control type="text" placeholder={placeholder} pattern={regex.gurmukhiWordRegex} value={supportWord} onChange={(event) => setSupportWord(event.target.value)} />
        </div>
        <div>
          {text('TRANSLATION')}
          <Form.Control type="text" placeholder="Enter translation" pattern={regex.englishSentenceRegex} value={translation} onChange={(event) => setTranslation(event.target.value)} />
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm fs-5 me-2 p-0"
            onClick={(event) => addNew(event, `${supportWord}:${translation}`)}
          >
            {text('CHECK')}
          </button>
          <button
            type="button"
            className="btn btn-sm fs-5 ms-2 p-0"
            onClick={remWord}
          >
            {text('CROSS')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportWord;
