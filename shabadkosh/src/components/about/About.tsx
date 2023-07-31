import React from 'react';
import { Card } from 'react-bootstrap';
import { Trans, useTranslation } from 'react-i18next';

function About() {
  const { t } = useTranslation();
  return (
    <div className="d-flex flex-column justify-content-center align-items-center m-4">
      <Card className="w-70">
        <Card.Body>
          <Card.Title>{t('ABOUT_TITLE')}</Card.Title>
          <Card.Text>
            <Trans components={{
              newline: <br />, bold: <b />,
            }}
            >
              {t('ABOUT_CONTENT')}
            </Trans>
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
}

export default About;
