import React, {
  useState, Dispatch, SetStateAction,
} from 'react';
import { Form } from 'react-bootstrap';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import regex from '../constants/regex';
import { MiniWord, NewSentenceType } from '../../types';
import { capitalize } from './utils';

interface IProps {
  id: string;
  name: string;
  word: MiniWord[] | NewSentenceType[];
  setWord: Dispatch<SetStateAction<any[]>>;
  words: MiniWord[] | NewSentenceType[];
  type: string;
  placeholder: string;
}

function SupportWord({
  id, name, word, setWord, words, type, placeholder,
} : IProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [supportWord, setSupportWord] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const { t } = useTranslation();

  const onViewToggle = (e: any) => {
    e.preventDefault();
    setShowNewForm(!showNewForm);
  };

  const addNew = (e: any, option: string) => {
    e.preventDefault();
    if (option.includes(':')) {
      const [gurmukhi, english] = option.split(':').map((val) => val.trim());
      if (gurmukhi.match('^[\u0A00-\u0A76]+$') && english.match('^[a-zA-Z0-9 ]+$')) {
        const d = {
          value: gurmukhi,
          translation: english,
          label: `${gurmukhi} - ${english.toLowerCase()}`,
        } as any;
        let duplicate;
        let alreadyInWords;

        if (type === 'sentence') {
          d.sentence = gurmukhi;

          duplicate = (word as NewSentenceType[]).find(
            (obj) => obj.sentence === d.sentence,
          );
          alreadyInWords = (words as NewSentenceType[]).find(
            (obj) => obj.sentence === d.sentence,
          );
        } else {
          d.word = gurmukhi;

          duplicate = (word as MiniWord[]).find(
            (obj) => obj.word === d.word,
          );
          alreadyInWords = (words as MiniWord[]).find(
            (obj) => obj.word === d.word,
          );
        }

        if (!duplicate) {
          if (!alreadyInWords) {
            setWord((prev) => [...prev, d]);
          } else {
            alert(`${type} ${d.value} already exists, choose it from the dropdown`);
          }
        }

        setSupportWord('');
        setTranslation('');
      } else {
        alert(`Invalid value: ${option}`);
      }
    }
  };

  const remWord = (e: any) => {
    e.preventDefault();
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
        onClick={(e) => onViewToggle(e)}
      >
        {showNewForm ? '➖' : '➕'}
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
          {['synonyms', 'antonyms'].includes(type) ? t('WORD') : capitalize(type)}
          <Form.Control type="text" placeholder={placeholder} pattern={regex.gurmukhiWordRegex} value={supportWord} onChange={(e) => setSupportWord(e.target.value)} />
        </div>
        <div>
          {t('TRANSLATION')}
          <Form.Control type="text" placeholder="Enter translation" pattern={regex.englishSentenceRegex} value={translation} onChange={(e) => setTranslation(e.target.value)} />
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm fs-5 me-2 p-0"
            onClick={(e) => addNew(e, `${supportWord}:${translation}`)}
          >
            {t('CHECK')}
          </button>
          <button
            type="button"
            className="btn btn-sm fs-5 ms-2 p-0"
            onClick={(e) => remWord(e)}
          >
            {t('CROSS')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SupportWord;
