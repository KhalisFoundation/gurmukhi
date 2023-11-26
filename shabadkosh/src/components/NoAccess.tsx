import React from 'react';
import { Card } from 'react-bootstrap';
import { Trans, useTranslation } from 'react-i18next';

const NoAccess = () => {
  const { t: text } = useTranslation();
  return (
    <div className="d-flex flex-column justify-content-center align-items-center m-4">
      <Card className="w-70">
        <Card.Body>
          <Card.Title>{text('NO_ACCESS_TITLE')}</Card.Title>
          <Card.Text>
            <Trans components={{
              newline: <br />, bold: <b />,
            }}
            >
              {text('NO_ACCESS_CONTENT')}
            </Trans>
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

export default NoAccess;
