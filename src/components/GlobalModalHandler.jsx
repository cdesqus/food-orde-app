import React from 'react';
import { useApp } from '../context/AppContext';
import ConfirmationModal from './ConfirmationModal';

const GlobalModalHandler = () => {
    const { modal, closeModal } = useApp();

    return (
        <ConfirmationModal
            isOpen={modal?.isOpen}
            title={modal?.title}
            message={modal?.message}
            onConfirm={modal?.onConfirm}
            onCancel={closeModal}
            isAlert={modal?.isAlert}
        />
    );
};

export default GlobalModalHandler;
