import React, { FormEvent, useState } from 'react';
import { Form } from 'react-bootstrap';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import regex from '../constants/regex';
import { MiniWord, Option } from '../../types';

interface IProps {
  id: string;
  name: string;
  word: Option[];
  setWord: (id: string, option: Option[], type: string) => void;
  words: MiniWord[];
  placeholder: string;
  type : string;
}

const Options = ({
  id, name, word, setWord, words, placeholder, type,
} : IProps) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [option, setOption] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');
  const { t: text } = useTranslation();

  const onViewToggle = (event: FormEvent) => {
    event.preventDefault();
    setShowNewForm(!showNewForm);
  };

  const addNew = (event: FormEvent, optionString: string) => {
    event.preventDefault();
    if (optionString.includes(':')) {
      const [gurmukhi, english] = optionString.split(':').map((val) => val.trim());
      if (gurmukhi.match(regex.gurmukhiSentenceRegex)
        && english.match(regex.englishQuestionTranslationRegex)) {
        const newOption = {
          option: gurmukhi,
          translation: english,
          label: `${gurmukhi} (${english.toLowerCase()})`,
        } as Option;

        const duplicate = (word as Option[]).find(
          (obj) => obj.option === newOption.option,
        );

        const alreadyInWords = (words as MiniWord[]).find(
          (obj) => obj.word === newOption.option,
        );

        if (!duplicate && !alreadyInWords) {
          setWord(id, [...word, newOption] as Option[], type ?? '');
        } else {
          alert(text('ALREADY_EXISTS', { what: newOption.option }));
        }

        setOption('');
        setTranslation('');
      }
    }
  };

  const remWord = (event: React.MouseEvent) => {
    event.preventDefault();
    setOption('');
    setTranslation('');
  };

  const onChange = (selectedList: [], item: any) => {
    const newOption = {
      option: item.word ?? item.option,
      translation: item.translation,
      label: `${item.word ?? item.option} (${item.translation.toLowerCase()})`,
    } as Option;
    if (Object.keys(item).includes('id')) {
      newOption.id = item.id;
    }
    const updatedOptions = selectedList.map((val: Option) => {
      if (Object.keys(val).includes('id')) {
        if (val.id === item.id) {
          return newOption;
        }
      }
      return val;
    });
    setWord(id, updatedOptions as Option[], type ?? '');
  };

  return (
    <div>
      <Form.Label>{name}</Form.Label>
      <button
        type="button"
        className="btn btn-sm"
        onClick={(event) => onViewToggle(event)}
      >
        {text('HAND_PEN')}
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
          {text('OPTION')}
          <Form.Control id={`option${id}`} type="text" placeholder={placeholder} pattern={regex.gurmukhiSentenceRegex} value={option} onChange={(event) => setOption(event.target.value)} />
          <Form.Control.Feedback type="invalid" itemID={`option${id}`}>{text('FEEDBACK_GURMUKHI', { for: text('OPTION') })}</Form.Control.Feedback>
        </div>
        <div>
          {text('TRANSLATION')}
          <Form.Control id={`otranslation${id}`} type="text" placeholder="Enter translation" pattern={regex.englishQuestionTranslationRegex} value={translation} onChange={(event) => setTranslation(event.target.value)} />
          <Form.Control.Feedback type="invalid" itemID={`otranslation${id}`}>{text('FEEDBACK_ENGLISH', { for: text('TRANSLATION') })}</Form.Control.Feedback>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm fs-5 me-2 p-0"
            onClick={(event) => addNew(event, `${option}:${translation}`)}
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

export default Options;
