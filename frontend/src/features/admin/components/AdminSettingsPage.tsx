import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Server, 
  Shield, 
  Mail, 
  Upload, 
  Bell, 
  Database, 
  Activity,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Badge } from '../../../components/ui/badge';
import { useToast } from '../../../components/ui/use-toast';
import { settingsApi } from '../../../api/adminApi';
import { 
  SystemSettings, 
  SystemInfo, 
  SystemHealth, 
  LogEntry
} from '../types';

interface SettingsSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children }) => (
  <Card className="mb-6">
    <CardHeader>
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          {icon}
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
);

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [logFilter, setLogFilter] = useState('all');
  const { toast } = useToast();

  // Charger les données initiales
  useEffect(() => {
    loadSettings();
    loadSystemInfo();
    loadSystemHealth();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getAllSettings();
      setSettings(response.data.data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const response = await settingsApi.getSystemInfo();
      setSystemInfo(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des informations système:', error);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await settingsApi.getSystemHealth();
      setSystemHealth(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement de la santé du système:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const params = logFilter !== 'all' ? { level: logFilter } : {};
      const response = await settingsApi.getSystemLogs(params);
      setLogs(response.data.data.logs);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(true);
      await settingsApi.updateSetting(key, value);
      await loadSettings();
      toast({
        title: "Succès",
        description: "Paramètre mis à jour avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paramètre",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmailConfig = async () => {
    if (!testEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email de test",
        variant: "destructive"
      });
      return;
    }

    try {
      await settingsApi.testEmailConfig(testEmail);
      toast({
        title: "Succès",
        description: "Email de test envoyé avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email de test",
        variant: "destructive"
      });
    }
  };

  const backupSettings = async () => {
    try {
      const response = await settingsApi.backupSettings();
      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle className="w-4 h-4" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4" />;
      case 'CRITICAL': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'WARN': return 'text-yellow-600 bg-yellow-100';
      case 'INFO': return 'text-blue-600 bg-blue-100';
      case 'DEBUG': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}j ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={loadSystemHealth}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button 
            onClick={backupSettings}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Statut de santé du système */}
      {systemHealth && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Santé du système</span>
              <Badge className={getHealthStatusColor(systemHealth.status)}>
                {getHealthStatusIcon(systemHealth.status)}
                <span className="ml-1">{systemHealth.status}</span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(systemHealth.checks).map(([check, status]) => (
                <div key={check} className="flex items-center space-x-2">
                  {status ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm capitalize">{check}</span>
                </div>
              ))}
            </div>
            {systemHealth.issues.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Problèmes détectés :</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {systemHealth.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <SettingsSection
            title="Paramètres généraux"
            description="Configuration de base du système"
            icon={<Settings className="w-5 h-5 text-blue-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="app-name">Nom de l'application</Label>
                  <Input 
                    id="app-name" 
                    defaultValue="BAI Consulting"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="app-version">Version</Label>
                  <Input 
                    id="app-version" 
                    value={systemInfo?.version || '1.0.0'}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="maintenance-mode">Mode maintenance</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Activer le mode maintenance</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select defaultValue="Europe/Paris">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Langue par défaut</Label>
                  <Select defaultValue="fr">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Onglet Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <SettingsSection
            title="Paramètres de sécurité"
            description="Configuration de la sécurité et de l'authentification"
            icon={<Shield className="w-5 h-5 text-red-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="session-timeout">Délai d'expiration de session (minutes)</Label>
                  <Input 
                    id="session-timeout" 
                    type="number" 
                    defaultValue="30"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="max-login-attempts">Tentatives de connexion max</Label>
                  <Input 
                    id="max-login-attempts" 
                    type="number" 
                    defaultValue="5"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="password-min-length">Longueur min du mot de passe</Label>
                  <Input 
                    id="password-min-length" 
                    type="number" 
                    defaultValue="8"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password-expiration">Expiration du mot de passe (jours)</Label>
                  <Input 
                    id="password-expiration" 
                    type="number" 
                    defaultValue="90"
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exigences du mot de passe</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="require-special-chars" />
                      <Label htmlFor="require-special-chars">Caractères spéciaux</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="require-numbers" />
                      <Label htmlFor="require-numbers">Chiffres</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="require-uppercase" />
                      <Label htmlFor="require-uppercase">Majuscules</Label>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Onglet Email */}
        <TabsContent value="email" className="space-y-6">
          <SettingsSection
            title="Configuration email"
            description="Paramètres SMTP et notifications par email"
            icon={<Mail className="w-5 h-5 text-green-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="smtp-host">Serveur SMTP</Label>
                  <Input 
                    id="smtp-host" 
                    defaultValue="smtp.gmail.com"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">Port SMTP</Label>
                  <Input 
                    id="smtp-port" 
                    type="number" 
                    defaultValue="587"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-user">Utilisateur SMTP</Label>
                  <Input 
                    id="smtp-user" 
                    type="email"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="smtp-from">Email expéditeur</Label>
                  <Input 
                    id="smtp-from" 
                    type="email"
                    defaultValue="noreply@bai-consulting.com"
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="smtp-secure" />
                  <Label htmlFor="smtp-secure">Connexion sécurisée (TLS)</Label>
                </div>
                <div>
                  <Label htmlFor="test-email">Email de test</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="test-email" 
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                    <Button 
                      variant="outline" 
                      onClick={testEmailConfig}
                      disabled={!testEmail || saving}
                    >
                      Tester
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Onglet Upload */}
        <TabsContent value="upload" className="space-y-6">
          <SettingsSection
            title="Paramètres d'upload"
            description="Configuration des fichiers et médias"
            icon={<Upload className="w-5 h-5 text-purple-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="max-file-size">Taille max des fichiers (MB)</Label>
                  <Input 
                    id="max-file-size" 
                    type="number" 
                    defaultValue="10"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="upload-path">Répertoire d'upload</Label>
                  <Input 
                    id="upload-path" 
                    defaultValue="./uploads"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="image-max-width">Largeur max des images (px)</Label>
                  <Input 
                    id="image-max-width" 
                    type="number" 
                    defaultValue="1920"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-max-height">Hauteur max des images (px)</Label>
                  <Input 
                    id="image-max-height" 
                    type="number" 
                    defaultValue="1080"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="video-max-duration">Durée max des vidéos (min)</Label>
                  <Input 
                    id="video-max-duration" 
                    type="number" 
                    defaultValue="60"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="compression-quality">Qualité de compression (%)</Label>
                  <Input 
                    id="compression-quality" 
                    type="number" 
                    defaultValue="80"
                    min="1"
                    max="100"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Onglet Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <SettingsSection
            title="Paramètres de notifications"
            description="Configuration des alertes et notifications"
            icon={<Bell className="w-5 h-5 text-orange-600" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Types de notifications</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="email-notifications" defaultChecked />
                      <Label htmlFor="email-notifications">Notifications par email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="push-notifications" />
                      <Label htmlFor="push-notifications">Notifications push</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="sms-notifications" />
                      <Label htmlFor="sms-notifications">Notifications SMS</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notification-frequency">Fréquence des notifications</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immédiate</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="admin-email">Email administrateur</Label>
                  <Input 
                    id="admin-email" 
                    type="email"
                    defaultValue="admin@bai-consulting.com"
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="system-alerts" defaultChecked />
                  <Label htmlFor="system-alerts">Alertes système</Label>
                </div>
                <div>
                  <Label htmlFor="maintenance-message">Message de maintenance</Label>
                  <Textarea 
                    id="maintenance-message" 
                    placeholder="Le système est en maintenance..."
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Onglet Système */}
        <TabsContent value="system" className="space-y-6">
          {/* Informations système */}
          {systemInfo && (
            <SettingsSection
              title="Informations système"
              description="État actuel du serveur et des ressources"
              icon={<Server className="w-5 h-5 text-gray-600" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Version Node.js</Label>
                    <p className="text-sm text-gray-600">{systemInfo.nodeVersion}</p>
                  </div>
                  <div>
                    <Label>Uptime</Label>
                    <p className="text-sm text-gray-600">{formatUptime(systemInfo.uptime)}</p>
                  </div>
                  <div>
                    <Label>Statut base de données</Label>
                    <Badge className={systemInfo.databaseStatus === 'CONNECTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {systemInfo.databaseStatus}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Utilisation mémoire</Label>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{formatBytes(systemInfo.memoryUsage.used)}</span>
                        <span>{formatBytes(systemInfo.memoryUsage.total)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${systemInfo.memoryUsage.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{systemInfo.memoryUsage.percentage}% utilisé</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Statistiques</Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Utilisateurs:</span>
                        <span>{systemInfo.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Formations:</span>
                        <span>{systemInfo.totalFormations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Banques:</span>
                        <span>{systemInfo.totalBanks}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SettingsSection>
          )}

          {/* Logs système */}
          <SettingsSection
            title="Logs système"
            description="Journal des événements et erreurs"
            icon={<Database className="w-5 h-5 text-indigo-600" />}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <Label>Filtrer par niveau:</Label>
                  <Select value={logFilter} onValueChange={setLogFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="ERROR">Erreur</SelectItem>
                      <SelectItem value="WARN">Avertissement</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="DEBUG">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" onClick={loadLogs}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucun log disponible
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                        <Badge className={getLogLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{log.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            {log.userId && <span>User: {log.userId}</span>}
                            {log.action && <span>Action: {log.action}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
