/* eslint-disable react-hooks/exhaustive-deps */
import {
  DocumentData, QuerySnapshot, Timestamp, doc, getDoc, onSnapshot,
} from 'firebase/firestore';
import React, { FormEvent, useEffect, useState } from 'react';
import {
  Form, Button, Card,
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { Multiselect } from 'multiselect-react-dropdown';
import { useTranslation } from 'react-i18next';
import { wordsCollection, updateWordlist } from '../util/controller';
import { auth, firestore } from '../../firebase';
import routes from '../constants/routes';
import { MiniWord } from '../../types/word';
import { STATUS } from '../constants';
import { NewWordlistType, WordlistType } from '../../types';

const EditWordlist = () => {
  const { wlid } = useParams();
  const getWordlist = doc(firestore, `wordlists/${wlid}`);

  const [formValues, setFormValues] = useState({
  } as any);
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [found, setFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wordlist, setWordlist] = useState<NewWordlistType>({});
  const [words, setWords] = useState<MiniWord[]>([]);
  const [selectedWords, setSelectedWords] = useState<MiniWord[]>([]);
  const { t: text } = useTranslation();

  useEffect(() => {
    let localWlist = [] as MiniWord[];
    const fetchWords = async () => {
      setIsLoading(true);
      onSnapshot(wordsCollection, (snapshot:
      QuerySnapshot<DocumentData>) => {
        const allWords = snapshot.docs.map((wordDoc) => ({
          id: wordDoc.id,
          word: wordDoc.data().word,
        } as MiniWord));
        localWlist = allWords;
        setWords(allWords);
      });

      setIsLoading(false);
    };

    const fillFormValues = (wordlistData: any) => {
      const formVal = {
      } as any;
      Object.keys(wordlistData).forEach((key) => {
        formVal[key] = wordlistData[key];
        (document.getElementById(key) as HTMLInputElement)?.setAttribute('value', wordlistData[key]);
      });
      setFormValues(formVal);
    };

    const fetchWordlist = async () => {
      setIsLoading(true);
      const docSnap = await getDoc(getWordlist);
      if (docSnap.exists()) {
        const wordlistData = {
          id: docSnap.id,
          created_at: docSnap.data().created_at,
          created_by: docSnap.data().created_by,
          updated_at: docSnap.data().updated_at,
          updated_by: docSnap.data().updated_by,
          words: docSnap.data().words ?? [],
          ...docSnap.data(),
        } as WordlistType;

        const filteredWords = ((wordlistData.words as string[])
          ?.map((word: string) => localWlist.find((val: MiniWord) => val.id === word))
          .filter((word: MiniWord | undefined) => word !== undefined) ?? []) as MiniWord[];


        wordlistData.words = filteredWords;
        setFound(true);
        setWordlist(wordlistData);
        setSelectedWords(filteredWords);
        fillFormValues(wordlistData);
        setIsLoading(false);
      } else {
        setFound(false);
        setIsLoading(false);
      }
    };
    fetchWords();
    fetchWordlist();
  }, []);

  const resetState = () => {
    setValidated(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({
      ...formValues, [event.target.id]: event.target.value,
    });
  };

  const onMultiselectChange = (selectedList: []) => {
    setSelectedWords(selectedList);
  };

  const editWordlist = (formData: any) => {
    setIsLoading(true);

    updateWordlist(getWordlist, {
      ...formData,
    })
      .finally(() => {
        setIsLoading(false);
      });

    resetState();
    setSubmitted(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    const formData = {
      id: formValues.id,
      name: formValues.name,
      status: formValues.status,
      words: selectedWords.map((word) => word.id),
      metadata: {
        curriculum: formValues.curriculum ?? formValues.metadata.curriculum,
        level: formValues.level ?? formValues.metadata.level,
        subgroup: formValues.subgroup ?? formValues.metadata.subgroup,
      },
      created_by: formValues.created_by,
      created_at: formValues.created_at,
      updated_by: auth.currentUser?.email,
      updated_at: Timestamp.now(),
      notes: formValues.notes,
    };

    editWordlist(formData);
  };

  const navigate = useNavigate();

  if (isLoading) {
    return <h2>{text('LOADING')}</h2>;
  }
  if (!found) {
    return <h2>{text('NOT_FOUND', { what: text('WORDLIST') })}</h2>;
  }
  return (
    <div className="d-flex flex-column justify-content-center align-items-center background container">
      <h2>{text('EDIT_TEXT', { for: text('WORDLIST') })}</h2>
      <Form className="rounded p-4 p-sm-3" hidden={submitted} noValidate validated={validated} onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="name" onChange={handleChange}>
          <Form.Label>{text('NAME')}</Form.Label>
          <Form.Control type="text" placeholder="Wordlist name" defaultValue={wordlist.name} required />
          <Form.Control.Feedback type="invalid">
            {text('ENTER_NAME', { for: text('WORDLIST') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="curriculum" onChange={handleChange}>
          <Form.Label>{text('CURRICULUM')}</Form.Label>
          <Form.Control type="text" placeholder="Curriculum" defaultValue={wordlist.metadata?.curriculum} />
          <Form.Control.Feedback type="invalid">
            {text('ENTER_NAME', { for: text('CURRICULUM') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="level" onChange={handleChange}>
          <Form.Label>{text('LEVEL')}</Form.Label>
          <Form.Control type="text" placeholder="Level" defaultValue={wordlist.metadata?.level} />
          <Form.Control.Feedback type="invalid">
            {text('ENTER_TEXT', { for: text('LEVEL') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="subgroup" onChange={handleChange}>
          <Form.Label>{text('SUBGROUP')}</Form.Label>
          <Form.Control type="text" placeholder="Subgroup" defaultValue={wordlist.metadata?.subgroup} />
          <Form.Control.Feedback type="invalid">
            {text('ENTER_NAME_BELONGS', { for: text('SUBGROUP') })}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="status" onChange={handleChange}>
          <Form.Label>{text('STATUS')}</Form.Label>
          <Form.Select aria-label="Default select example" defaultValue={wordlist.status}>
            {[STATUS.ACTIVE, STATUS.INACTIVE].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" controlId="words" onChange={handleChange}>
          <Form.Label>{text('WORDS')}</Form.Label>
          <Multiselect
            options={words}
            displayValue="word"
            showCheckbox
            onSelect={onMultiselectChange}
            onRemove={onMultiselectChange}
            selectedValues={selectedWords ?? []}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="notes" onChange={handleChange}>
          <Form.Label>{text('NOTES')}</Form.Label>
          <Form.Control as="textarea" rows={3} defaultValue={wordlist.notes} placeholder="Enter notes" />
        </Form.Group>

        <Button variant="primary" type="submit">
          {text('SUBMIT')}
        </Button>
      </Form>
      {submitted ? (
        <Card className="d-flex justify-content-center align-items-center background">
          <Card.Body className="rounded p-4 p-sm-3">
            <h3>{text('SUCCESS_UPDATE', { for: text('WORDLIST') })}</h3>
            <Button variant="primary" onClick={() => navigate(routes.wordlists)}>{text('BACK_TO', { page: text('WORDLISTS') })}</Button>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  );
};

export default EditWordlist;
