import React, { useState, useEffect } from 'react';
import Card from '../../components/Card';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import { getStripeSettings, updateStripeSettings } from '../../services/apiService';
import { LockIcon, IdCardIcon } from '../../components/icons';
import { showToast } from '../../utils';
import { StripeProductSettings } from '../../types';

const PaymentSettingsPage: React.FC = () => {
    const [publicKey, setPublicKey] = useState('');
    const [productSettings, setProductSettings] = useState<StripeProductSettings>({
        enrollmentProductId: '',
        enrollmentPriceId: '',
        auditionProductId: '',
        auditionPriceId: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const settings = await getStripeSettings();
                setPublicKey(settings.publicKey || '');
                setProductSettings({
                    enrollmentProductId: settings.enrollmentProductId || '',
                    enrollmentPriceId: settings.enrollmentPriceId || '',
                    auditionProductId: settings.auditionProductId || '',
                    auditionPriceId: settings.auditionPriceId || '',
                });
            } catch (error) {
                showToast('Failed to load Stripe settings.', 'error');
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'publicKey') {
            setPublicKey(value);
        } else {
            setProductSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateStripeSettings({
                publicKey,
                ...productSettings,
            });
            showToast('Stripe settings updated successfully! The server will restart automatically.', 'success');
        } catch (error) {
            showToast('Failed to update Stripe settings.', 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-brand-text-primary">Payment Gateway Settings</h1>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save All Settings'}
                </Button>
            </div>
            
            <div className="space-y-6">
                {/* Card for API Key */}
                <Card title="Stripe API Key" icon={<LockIcon />} collapsible={false}>
                    <div className="p-6">
                        <p className="text-sm text-brand-text-secondary mb-4">
                            Manage the public API key for Stripe. This key is used on the client-side to securely collect payment information.
                        </p>
                        <div className="max-w-md">
                            <Input
                                id="publicKey"
                                name="publicKey"
                                label="Stripe Public Key"
                                type="text"
                                value={publicKey}
                                onChange={handleSettingsChange}
                                placeholder="pk_test_..."
                                disabled={isLoading}
                            />
                        </div>
                         <p className="text-xs text-brand-text-muted mt-2">
                            This key is considered public and is safe to be exposed in the frontend. The secret key should never be exposed.
                        </p>
                    </div>
                </Card>

                {/* Card for Product IDs */}
                <Card title="Stripe Product & Price IDs" icon={<IdCardIcon />} collapsible={false}>
                    <div className="p-6">
                         <p className="text-sm text-brand-text-secondary mb-6">
                            Define the specific Product and Price IDs from your Stripe account that correspond to fixed charges like enrollment or auditions.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <Input
                                id="enrollmentProductId"
                                name="enrollmentProductId"
                                label="Enrollment Product ID"
                                value={productSettings.enrollmentProductId}
                                onChange={handleSettingsChange}
                                placeholder="prod_..."
                                disabled={isLoading}
                            />
                            <Input
                                id="enrollmentPriceId"
                                name="enrollmentPriceId"
                                label="Enrollment Price ID"
                                value={productSettings.enrollmentPriceId}
                                onChange={handleSettingsChange}
                                placeholder="price_..."
                                disabled={isLoading}
                            />
                            <Input
                                id="auditionProductId"
                                name="auditionProductId"
                                label="Audition Product ID"
                                value={productSettings.auditionProductId}
                                onChange={handleSettingsChange}
                                placeholder="prod_..."
                                disabled={isLoading}
                            />
                            <Input
                                id="auditionPriceId"
                                name="auditionPriceId"
                                label="Audition Price ID"
                                value={productSettings.auditionPriceId}
                                onChange={handleSettingsChange}
                                placeholder="price_..."
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </form>
    );
};

export default PaymentSettingsPage;

