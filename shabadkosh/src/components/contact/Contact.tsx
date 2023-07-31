import React from 'react';
import { Card } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  return (
    <div>
      <Card>
        <Card.Body>
          <Card.Title>{t('CONTACT')}</Card.Title>
        </Card.Body>
      </Card>
    </div>
  );
}
