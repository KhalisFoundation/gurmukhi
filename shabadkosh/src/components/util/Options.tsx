import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import Multiselect from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import regex from '../constants/regex';
import { MiniWord, Option } from '../../types';

interface IProps {
  id: string;
  name: string;
  word: Option[];
  setWord: (id: string, option: any, type: string) => void;
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
  const { t } = useTranslation();

  const onViewToggle = (e: any) => {
    e.preventDefault();
    setShowNewForm(!showNewForm);
  };

  const addNew = (e: any, newOption: string) => {
    e.preventDefault();
    if (newOption.includes(':')) {
      const [gurmukhi, english] = newOption.split(':').map((val) => val.trim());
      if (gurmukhi.match(regex.gurmukhiSentenceRegex)
        && english.match(regex.englishSentenceRegex)) {
        const d = {
          option: gurmukhi,
          translation: english,
          label: `${gurmukhi} (${english.toLowerCase()})`,
        } as any;

        const duplicate = (word as Option[]).find(
          (obj) => obj.option === d.option,
        );

        const alreadyInWords = (words as MiniWord[]).find(
          (obj) => obj.word === d.option,
        );

        if (!duplicate) {
          if (!alreadyInWords) {
            setWord(id, [...word, d], type ?? '');
          } else {
            alert(`${d.option} already exists, choose it from the dropdown`);
          }
        }

        setOption('');
        setTranslation('');
      }
    }
  };

  const remWord = (e: any) => {
    e.preventDefault();
    setOption('');
    setTranslation('');
  };

  const onChange = (selectedList: [], item: any) => {
    const newOpt = {
      option: item.word ?? item.option,
      translation: item.translation,
      label: `${item.word ?? item.option} (${item.translation.toLowerCase()})`,
    } as any;
    if (Object.keys(item).includes('id')) {
      newOpt.id = item.id;
    }
    const updatedOptions = selectedList.map((val: Option) => {
      if (Object.keys(val).includes('id')) {
        if (val.id === item.id) {
          return newOpt;
        }
        return val;
      }
      return val;
    });
    setWord(id, updatedOptions, type ?? '');
  };

  return (
    <div>
      <Form.Label>{name}</Form.Label>
      <button
        type="button"
        className="btn btn-sm"
        onClick={(e) => onViewToggle(e)}
      >
        {t('HAND_PEN')}
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
          {t('OPTION')}
          <Form.Control id={`option${id}`} type="text" placeholder={placeholder} pattern={regex.gurmukhiSentenceRegex} value={option} onChange={(e) => setOption(e.target.value)} />
          <Form.Control.Feedback type="invalid" itemID={`option${id}`}>{t('FEEDBACK_GURMUKHI', { for: t('OPTION') })}</Form.Control.Feedback>
        </div>
        <div>
          {t('TRANSLATION')}
          <Form.Control id={`otranslation${id}`} type="text" placeholder="Enter translation" pattern={regex.englishSentenceRegex} value={translation} onChange={(e) => setTranslation(e.target.value)} />
          <Form.Control.Feedback type="invalid" itemID={`otranslation${id}`}>{t('FEEDBACK_ENGLISH', { for: t('TRANSLATION') })}</Form.Control.Feedback>
        </div>
        <div>
          <button
            type="button"
            className="btn btn-sm fs-5 me-2 p-0"
            onClick={(e) => addNew(e, `${option}:${translation}`)}
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
};

export default Options;
